import { Test, TestingModule } from '@nestjs/testing';
import { UraPrivateResiController } from './ura-private-resi.controller';
import { UraPrivateResiService } from './ura-private-resi.service';

describe('UraPrivateResiController', () => {
  let controller: UraPrivateResiController;
  let service: {
    createUraPrivateResi: jest.Mock;
    getTransactionsByBoundingBox: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createUraPrivateResi: jest.fn(),
      getTransactionsByBoundingBox: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UraPrivateResiController],
      providers: [
        {
          provide: UraPrivateResiService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<UraPrivateResiController>(UraPrivateResiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes numeric bounding box values to the ura-private-resi service', async () => {
    const rows = [
      {
        transaction_id: 10,
        ura_private_resi_id: 1,
        project: 'Project',
        street: 'Street',
        market_segment: 'CCR',
        contract_date: '0124',
        price: 1000000,
      },
    ];
    service.getTransactionsByBoundingBox.mockResolvedValue(rows);

    await expect(
      controller.getTransactionsByBoundingBox(103.57, 1.19, 104.05, 1.474),
    ).resolves.toBe(rows);

    expect(service.getTransactionsByBoundingBox).toHaveBeenCalledWith(
      103.57,
      1.19,
      104.05,
      1.474,
    );
  });
});
