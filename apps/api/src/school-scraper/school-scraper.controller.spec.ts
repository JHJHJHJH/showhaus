import { Test, TestingModule } from '@nestjs/testing';
import { SchoolScraperController } from './school-scraper.controller';
import { SchoolScraperService } from './school-scraper.service';
import { SchoolType } from './dtos/school-scrape.dto';

describe('SchoolScraperController', () => {
  let controller: SchoolScraperController;
  let service: {
    scrape: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      scrape: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolScraperController],
      providers: [
        {
          provide: SchoolScraperService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SchoolScraperController>(SchoolScraperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('calls service.scrape and returns started message', async () => {
    const dto = { school_type: SchoolType.PRIMARY };
    service.scrape.mockResolvedValue([]);
    const result = await controller.scrape(dto);
    expect(service.scrape).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'school-scrape started' });
  });
});
