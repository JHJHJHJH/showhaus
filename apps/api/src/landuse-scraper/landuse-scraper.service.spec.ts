import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { LanduseService } from '../landuse/landuse.service';
import { LanduseScraperService } from './landuse-scraper.service';

describe('LanduseScraperService', () => {
  let service: LanduseScraperService;
  let landuseService: {
    getActiveDatasetVersion: jest.Mock;
    createProcessingDatasetVersion: jest.Mock;
    insertFeaturesBatch: jest.Mock;
    activateDatasetVersion: jest.Mock;
    failDatasetVersion: jest.Mock;
  };
  let httpService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    landuseService = {
      getActiveDatasetVersion: jest.fn(),
      createProcessingDatasetVersion: jest.fn(),
      insertFeaturesBatch: jest.fn(),
      activateDatasetVersion: jest.fn(),
      failDatasetVersion: jest.fn(),
    };

    httpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanduseScraperService,
        {
          provide: LanduseService,
          useValue: landuseService,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<LanduseScraperService>(LanduseScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('does nothing when the upstream dataset is unchanged', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          code: 0,
          data: {
            datasetId: 'd_a8c3546b26712e35021f3a681d0353ae',
            name: 'Master Plan 2025 Land Use',
            format: 'geojson',
            lastUpdatedAt: '2026-05-01T00:00:00+08:00',
          },
        },
      }),
    );

    landuseService.getActiveDatasetVersion.mockResolvedValue({
      upstreamLastUpdatedAt: new Date('2026-04-30T16:00:00.000Z'),
    });

    const resolveDownloadUrlSpy = jest.spyOn(service, 'resolveDownloadUrl');

    await service.syncIfUpdated();

    expect(
      landuseService.createProcessingDatasetVersion,
    ).not.toHaveBeenCalled();
    expect(resolveDownloadUrlSpy).not.toHaveBeenCalled();
  });

  it('downloads and activates a new dataset snapshot', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          code: 0,
          data: {
            datasetId: 'd_a8c3546b26712e35021f3a681d0353ae',
            name: 'Master Plan 2025 Land Use',
            format: 'geojson',
            lastUpdatedAt: '2026-05-01T00:00:00+08:00',
          },
        },
      }),
    );

    landuseService.getActiveDatasetVersion.mockResolvedValue(null);
    landuseService.createProcessingDatasetVersion.mockResolvedValue({ id: 42 });

    jest
      .spyOn(service, 'resolveDownloadUrl')
      .mockResolvedValue('https://example.com/landuse.geojson');
    jest.spyOn(service, 'downloadGeojsonFile').mockResolvedValue('/tmp/file');
    jest
      .spyOn(service, 'iterateFeatures')
      .mockImplementation(async function* () {
        yield {
          type: 'Feature',
          properties: {
            OBJECTID: 1,
            LU_DESC: 'Residential',
            GPR: '3.5',
            INC_CRC: 'crc-1',
            FMEL_UPD_D: '2026-05-01',
            Shape_Area: 12.3,
            Shape_Leng: 4.5,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [103.8, 1.3],
                [103.81, 1.3],
                [103.81, 1.31],
                [103.8, 1.3],
              ],
            ],
          },
        };
      });

    await service.syncIfUpdated();

    expect(landuseService.createProcessingDatasetVersion).toHaveBeenCalled();
    expect(landuseService.insertFeaturesBatch).toHaveBeenCalledTimes(1);
    expect(landuseService.activateDatasetVersion).toHaveBeenCalledWith(42, 1);
    expect(landuseService.failDatasetVersion).not.toHaveBeenCalled();
  });

  it('marks the new dataset version as failed when ingest errors', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          code: 0,
          data: {
            datasetId: 'd_a8c3546b26712e35021f3a681d0353ae',
            name: 'Master Plan 2025 Land Use',
            format: 'geojson',
            lastUpdatedAt: '2026-05-01T00:00:00+08:00',
          },
        },
      }),
    );

    landuseService.getActiveDatasetVersion.mockResolvedValue(null);
    landuseService.createProcessingDatasetVersion.mockResolvedValue({ id: 43 });

    jest
      .spyOn(service, 'resolveDownloadUrl')
      .mockResolvedValue('https://example.com/landuse.geojson');
    jest.spyOn(service, 'downloadGeojsonFile').mockResolvedValue('/tmp/file');
    jest
      .spyOn(service, 'iterateFeatures')
      .mockImplementation(async function* () {
        yield {
          type: 'Feature',
          properties: { OBJECTID: 1 },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [103.8, 1.3],
                [103.81, 1.3],
                [103.81, 1.31],
                [103.8, 1.3],
              ],
            ],
          },
        };
      });
    landuseService.insertFeaturesBatch.mockRejectedValue(
      new Error('insert failed'),
    );

    await expect(service.syncIfUpdated()).rejects.toThrow('insert failed');

    expect(landuseService.failDatasetVersion).toHaveBeenCalledWith(
      43,
      'insert failed',
    );
    expect(landuseService.activateDatasetVersion).not.toHaveBeenCalled();
  });

  it('retries poll-download until a URL is returned', async () => {
    httpService.get
      .mockReturnValueOnce(
        of({
          data: {
            code: 0,
            data: {
              status: 'processing',
            },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            code: 0,
            data: {
              status: 'success',
              url: 'https://example.com/landuse.geojson',
            },
          },
        }),
      );

    jest.spyOn(service, 'sleep').mockResolvedValue(undefined);

    await expect(service.resolveDownloadUrl()).resolves.toBe(
      'https://example.com/landuse.geojson',
    );
    expect(httpService.get).toHaveBeenCalledTimes(2);
  });
});
