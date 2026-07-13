import { Test, TestingModule } from '@nestjs/testing';
import { UraScraperService } from './ura-scraper.service';
import { HttpService } from '@nestjs/axios';
import { UraPrivateResiService } from '../ura-private-resi/ura-private-resi.service';
import { TransactionService } from '../transaction/transaction.service';
import { ConfigService } from '@nestjs/config';

describe('UraScraperService', () => {
  let service: UraScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UraScraperService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UraPrivateResiService,
          useValue: {
            findUraPrivateResiByParam: jest.fn(),
            createUraPrivateResi: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            findTransactionByParam: jest.fn(),
            createTransaction: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UraScraperService>(UraScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
