import { DataSource, Repository } from 'typeorm';
import { LanduseDatasetVersionEntity } from './landuse-dataset-version.entity';
import { LanduseFeatureEntity } from './landuse-feature.entity';
import { LanduseService } from './landuse.service';

describe('LanduseService', () => {
  let service: LanduseService;
  let datasetVersionRepository: {
    create: jest.Mock;
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
  };
  let featureRepository: {
    insert: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };
  let manager: {
    delete: jest.Mock;
    update: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(() => {
    datasetVersionRepository = {
      create: jest.fn((entity) => entity),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
    };
    featureRepository = {
      insert: jest.fn(),
    };
    manager = {
      delete: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(async (work) => work(manager)),
    };

    service = new LanduseService(
      datasetVersionRepository as unknown as Repository<LanduseDatasetVersionEntity>,
      featureRepository as unknown as Repository<LanduseFeatureEntity>,
      dataSource as unknown as DataSource,
    );
  });

  it('creates a processing dataset version when the upstream timestamp is new', async () => {
    datasetVersionRepository.findOne.mockResolvedValue(null);
    datasetVersionRepository.save.mockResolvedValue({ id: 42 });

    await expect(
      service.createProcessingDatasetVersion({
        datasetId: 'dataset-1',
        name: 'Land Use',
        format: 'GEOJSON',
        lastUpdatedAt: '2026-03-27T10:07:23+08:00',
      }),
    ).resolves.toEqual({ id: 42 });

    expect(datasetVersionRepository.save).toHaveBeenCalledWith({
      datasetId: 'dataset-1',
      datasetName: 'Land Use',
      format: 'GEOJSON',
      upstreamLastUpdatedAt: new Date('2026-03-27T10:07:23+08:00'),
      rawMetadata: {
        datasetId: 'dataset-1',
        name: 'Land Use',
        format: 'GEOJSON',
        lastUpdatedAt: '2026-03-27T10:07:23+08:00',
      },
      status: 'processing',
      isActive: false,
    });
  });

  it('resets an existing dataset version for the same upstream timestamp before retrying', async () => {
    datasetVersionRepository.findOne.mockResolvedValue({ id: 7 });
    datasetVersionRepository.findOneOrFail.mockResolvedValue({
      id: 7,
      status: 'processing',
    });

    await expect(
      service.createProcessingDatasetVersion({
        datasetId: 'dataset-1',
        name: 'Land Use',
        format: 'GEOJSON',
        lastUpdatedAt: '2026-03-27T10:07:23+08:00',
      }),
    ).resolves.toEqual({ id: 7, status: 'processing' });

    expect(featureRepository.insert).not.toHaveBeenCalled();
    expect(manager.delete).toHaveBeenCalledWith(LanduseFeatureEntity, {
      datasetVersionId: 7,
    });
    expect(manager.update).toHaveBeenCalledWith(
      LanduseDatasetVersionEntity,
      { id: 7 },
      expect.objectContaining({
        datasetName: 'Land Use',
        format: 'GEOJSON',
        featureCount: 0,
        status: 'processing',
        isActive: false,
        completedAt: null,
        errorMessage: '',
      }),
    );
    expect(datasetVersionRepository.save).not.toHaveBeenCalled();
  });
});
