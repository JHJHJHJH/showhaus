import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UraPrivateResiEntity } from './ura-private-resi.entity';
import { UraPrivateResiService } from './ura-private-resi.service';

describe('UraPrivateResiService', () => {
  let service: UraPrivateResiService;
  let repository: {
    save: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
    query: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UraPrivateResiService,
        {
          provide: getRepositoryToken(UraPrivateResiEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UraPrivateResiService>(UraPrivateResiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('queries lean transaction rows inside the bounding box with parameters', async () => {
    const rows = [
      {
        transaction_id: 2,
        ura_private_resi_id: 10,
        project: 'A',
        street: 'B',
        market_segment: 'RCR',
        contract_date: '1225',
        price: 1200000,
        area: 80,
        floor_range: '01-05',
        no_of_units: 1,
        property_type: 'Condominium',
        district: '10',
        type_of_area: 'Strata',
        type_of_sale: 'Resale',
        tenure: 'Freehold',
      },
    ];
    repository.query.mockResolvedValue(rows);

    await expect(
      service.getTransactionsByBoundingBox(103.57, 1.19, 104.05, 1.474),
    ).resolves.toEqual(rows);

    expect(repository.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM ura_private_resi_transaction_lean lean'),
      [103.57, 1.19, 104.05, 1.474],
    );
    expect(repository.query.mock.calls[0][0]).toContain(
      'loc.geometry::geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326)',
    );
  });

  it('sorts lean rows latest first and invalid contract dates last', async () => {
    repository.query.mockResolvedValue([]);

    await service.getTransactionsByBoundingBox(103.57, 1.19, 104.05, 1.474);

    expect(repository.query.mock.calls[0][0]).toContain(
      "WHEN lean.contract_date ~ '^[0-9]{4}$'",
    );
    expect(repository.query.mock.calls[0][0]).toContain(
      "THEN to_date(lean.contract_date, 'MMyy')",
    );
    expect(repository.query.mock.calls[0][0]).toContain('END DESC NULLS LAST');
    expect(repository.query.mock.calls[0][0]).toContain(
      'lean.transaction_id DESC',
    );
  });
});
