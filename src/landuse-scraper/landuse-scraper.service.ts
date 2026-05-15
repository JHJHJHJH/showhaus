import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { createWriteStream } from 'fs';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  ILanduseDatasetMetadata,
  ILanduseFeatureInput,
} from '../landuse/landuse.interface';
import { LanduseService } from '../landuse/landuse.service';
import {
  IGeoJsonFeature,
  iterateGeoJsonFeatures,
} from './geojson-feature-stream';

interface IDataGovMetadataResponse {
  code: number;
  data: ILanduseDatasetMetadata;
  errorMsg?: string;
}

interface IDataGovPollDownloadResponse {
  code: number;
  data: {
    status?: string;
    url?: string;
  };
  errorMsg?: string;
}

@Injectable()
export class LanduseScraperService {
  private readonly logger = new Logger(LanduseScraperService.name);
  private readonly datasetId = 'd_a8c3546b26712e35021f3a681d0353ae';
  private readonly batchSize = 500;
  private readonly pollAttempts = 5;
  private readonly pollDelayMs = 2000;

  constructor(
    private readonly httpService: HttpService,
    private readonly landuseService: LanduseService,
  ) {}

  @Cron('0 0 * * *', {
    name: 'landuse-scraper',
    timeZone: 'Asia/Singapore',
  })
  async syncDailyLanduse() {
    await this.syncIfUpdated();
  }

  async syncIfUpdated() {
    this.logger.log('Checking land-use dataset metadata...');

    const metadata = await this.fetchDatasetMetadata();
    const activeVersion = await this.landuseService.getActiveDatasetVersion(
      this.datasetId,
    );

    if (
      activeVersion != null &&
      activeVersion.upstreamLastUpdatedAt.toISOString() ===
        new Date(metadata.lastUpdatedAt).toISOString()
    ) {
      this.logger.log('No new land-use dataset update found.');
      return;
    }

    const datasetVersion =
      await this.landuseService.createProcessingDatasetVersion(metadata);

    let filePath: string | null = null;

    try {
      const downloadUrl = await this.resolveDownloadUrl();
      filePath = await this.downloadGeojsonFile(downloadUrl, datasetVersion.id);

      let processedCount = 0;
      let featureIndex = 0;
      let batch: ILanduseFeatureInput[] = [];

      for await (const feature of this.iterateFeatures(filePath)) {
        batch.push(this.mapFeature(feature, featureIndex));
        featureIndex += 1;

        if (batch.length >= this.batchSize) {
          await this.landuseService.insertFeaturesBatch(
            datasetVersion.id,
            batch,
          );
          processedCount += batch.length;
          batch = [];
        }
      }

      if (batch.length > 0) {
        await this.landuseService.insertFeaturesBatch(datasetVersion.id, batch);
        processedCount += batch.length;
      }

      await this.landuseService.activateDatasetVersion(
        datasetVersion.id,
        processedCount,
      );
      this.logger.log(
        `Land-use dataset sync complete with ${processedCount} features.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown land-use sync error';
      this.logger.error(message);
      await this.landuseService.failDatasetVersion(datasetVersion.id, message);
      throw error;
    } finally {
      if (filePath != null) {
        await rm(filePath, { force: true });
      }
    }
  }

  async fetchDatasetMetadata(): Promise<ILanduseDatasetMetadata> {
    const url = `https://api-production.data.gov.sg/v2/public/api/datasets/${this.datasetId}/metadata`;
    const response = await firstValueFrom(
      this.httpService.get<IDataGovMetadataResponse>(url),
    );

    if (response.data.code !== 0 || response.data.data == null) {
      throw new Error(response.data.errorMsg || 'Failed to fetch metadata');
    }

    return response.data.data;
  }

  async resolveDownloadUrl(): Promise<string> {
    for (let attempt = 1; attempt <= this.pollAttempts; attempt += 1) {
      const response = await this.pollDownload();
      const status = response.data.status?.toLowerCase();
      const url = response.data.url;

      if (url != null && url !== '') {
        return url;
      }

      if (status === 'failed') {
        throw new Error('data.gov.sg reported a failed land-use download');
      }

      if (attempt < this.pollAttempts) {
        await this.sleep(this.pollDelayMs);
      }
    }

    throw new Error('Timed out waiting for land-use download URL');
  }

  async pollDownload(): Promise<IDataGovPollDownloadResponse> {
    const url = `https://api-open.data.gov.sg/v1/public/api/datasets/${this.datasetId}/poll-download`;
    const response = await firstValueFrom(
      this.httpService.get<IDataGovPollDownloadResponse>(url),
    );

    if (response.data.code !== 0 || response.data.data == null) {
      throw new Error(response.data.errorMsg || 'Failed to poll download URL');
    }

    return response.data;
  }

  async downloadGeojsonFile(
    downloadUrl: string,
    datasetVersionId: number,
  ): Promise<string> {
    const directory = join(tmpdir(), 'showhouse-landuse');
    const filePath = join(directory, `landuse-${datasetVersionId}.geojson`);

    await mkdir(directory, { recursive: true });

    const response = await firstValueFrom(
      this.httpService.get(downloadUrl, {
        responseType: 'stream',
      }),
    );

    await new Promise<void>((resolve, reject) => {
      const writer = createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.on('error', reject);
    });

    return filePath;
  }

  async *iterateFeatures(filePath: string) {
    for await (const feature of iterateGeoJsonFeatures(filePath)) {
      yield feature;
    }
  }

  mapFeature(
    feature: IGeoJsonFeature,
    featureIndex: number,
  ): ILanduseFeatureInput {
    if (feature.geometry == null) {
      throw new Error(`Feature ${featureIndex} is missing geometry`);
    }

    if (
      feature.geometry.type !== 'Polygon' &&
      feature.geometry.type !== 'MultiPolygon'
    ) {
      throw new Error(
        `Unsupported geometry type "${feature.geometry.type}" for feature ${featureIndex}`,
      );
    }

    const properties = feature.properties ?? {};

    return {
      objectId: this.readString(
        properties.OBJECTID ??
          properties.objectid ??
          feature.id ??
          featureIndex,
      ),
      luDesc: this.readString(properties.LU_DESC ?? properties.lu_desc),
      gpr: this.readString(properties.GPR ?? properties.gpr),
      incCrc: this.readString(properties.INC_CRC ?? properties.inc_crc),
      fmelUpdDRaw: this.readString(
        properties.FMEL_UPD_D ?? properties.fmel_upd_d,
      ),
      shapeArea: this.readNumber(
        properties.Shape_Area ?? properties.shape_area ?? properties.SHAPE_Area,
      ),
      shapeLen: this.readNumber(
        properties.Shape_Leng ?? properties.shape_len ?? properties.SHAPE_Leng,
      ),
      properties,
      geometry: feature.geometry,
    };
  }

  sleep(delayMs: number) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private readString(value: unknown): string {
    if (value == null) {
      return '';
    }

    return String(value);
  }

  private readNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
}
