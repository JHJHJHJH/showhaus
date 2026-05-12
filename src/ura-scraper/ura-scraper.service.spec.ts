import { Test, TestingModule } from '@nestjs/testing';
import { UraScraperService } from './ura-scraper.service';
import { HttpService } from '@nestjs/axios';
import { LocationService } from '../location/location.service';
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
          provide: LocationService,
          useValue: {
            findLocationByParam: jest.fn(),
            createLocation: jest.fn(),
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
