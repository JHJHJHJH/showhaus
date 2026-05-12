import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LanduseDatasetVersionEntity } from './landuse-dataset-version.entity';
import { LanduseFeatureEntity } from './landuse-feature.entity';
import { ILanduseDatasetMetadata, ILanduseFeatureInput } from './landuse.interface';

@Injectable()
export class LanduseService {
  constructor(
    @InjectRepository(LanduseDatasetVersionEntity)
    private readonly datasetVersionRepository: Repository<LanduseDatasetVersionEntity>,
    @InjectRepository(LanduseFeatureEntity)
    private readonly featureRepository: Repository<LanduseFeatureEntity>,
    private readonly dataSource: DataSource,
  ) {}

  getActiveDatasetVersion(datasetId: string) {
    return this.datasetVersionRepository.findOne({
      where: { datasetId, isActive: true },
      order: { upstreamLastUpdatedAt: 'DESC' },
    });
  }

  createProcessingDatasetVersion(metadata: ILanduseDatasetMetadata) {
    return this.datasetVersionRepository.save(
      this.datasetVersionRepository.create({
        datasetId: metadata.datasetId,
        datasetName: metadata.name ?? '',
        format: metadata.format ?? '',
        upstreamLastUpdatedAt: new Date(metadata.lastUpdatedAt),
        rawMetadata: metadata,
        status: 'processing',
        isActive: false,
      }),
    );
  }

  async insertFeaturesBatch(
    datasetVersionId: number,
    features: ILanduseFeatureInput[],
  ) {
    if (features.length === 0) {
      return;
    }

    await this.featureRepository.insert(
      features.map((feature) => ({
        datasetVersionId,
        objectId: feature.objectId,
        luDesc: feature.luDesc,
        gpr: feature.gpr,
        incCrc: feature.incCrc,
        fmelUpdDRaw: feature.fmelUpdDRaw,
        shapeArea: feature.shapeArea,
        shapeLen: feature.shapeLen,
        properties: feature.properties,
        geometry: feature.geometry,
      })),
    );
  }

  async activateDatasetVersion(datasetVersionId: number, featureCount: number) {
    await this.dataSource.transaction(async (manager) => {
      const targetVersion = await manager.findOne(LanduseDatasetVersionEntity, {
        where: { id: datasetVersionId },
      });

      if (targetVersion == null) {
        throw new Error(`Dataset version ${datasetVersionId} not found`);
      }

      await manager.update(
        LanduseDatasetVersionEntity,
        { datasetId: targetVersion.datasetId, isActive: true },
        { isActive: false },
      );

      await manager.update(
        LanduseDatasetVersionEntity,
        { id: datasetVersionId },
        {
          status: 'succeeded',
          isActive: true,
          featureCount,
          completedAt: new Date(),
          errorMessage: '',
        },
      );
    });
  }

  async failDatasetVersion(datasetVersionId: number, errorMessage: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(LanduseFeatureEntity, {
        datasetVersionId,
      });

      await manager.update(
        LanduseDatasetVersionEntity,
        { id: datasetVersionId },
        {
          status: 'failed',
          isActive: false,
          completedAt: new Date(),
          errorMessage,
        },
      );
    });
  }
}
