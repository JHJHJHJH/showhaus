import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { SchoolScraperService } from './school-scraper.service';
import { SchoolType } from './dtos/school-scrape.dto';
import * as fs from 'fs/promises';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchoolEntity } from './school.entity';

jest.mock('fs/promises');

describe('SchoolScraperService', () => {
  let service: SchoolScraperService;
  let httpService: {
    get: jest.Mock;
  };
  let schoolRepository: {
    upsert: jest.Mock;
  };

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    };
    schoolRepository = {
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolScraperService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: getRepositoryToken(SchoolEntity),
          useValue: schoolRepository,
        },
      ],
    }).compile();

    service = module.get<SchoolScraperService>(SchoolScraperService);
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('scrapes schools by type', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          found: 1,
          totalNumPages: 1,
          pageNum: 1,
          results: [
            {
              SEARCHVAL: 'TEST PRIMARY SCHOOL',
              BLK_NO: '1',
              ROAD_NAME: 'TEST ROAD',
              BUILDING: 'TEST PRIMARY SCHOOL',
              ADDRESS: '1 TEST ROAD SINGAPORE 123456',
              POSTAL: '123456',
              LATITUDE: '1.3',
              LONGITUDE: '103.8',
            },
          ],
        },
      }),
    );

    const results = await service.scrape({ school_type: SchoolType.PRIMARY });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('TEST PRIMARY SCHOOL');
    expect(results[0].coordinates.latitude).toBe(1.3);
  });
});
