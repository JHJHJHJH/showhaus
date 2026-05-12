import { Test, TestingModule } from '@nestjs/testing';
import { UraScraperController } from './ura-scraper.controller';
import { UraScraperService } from './ura-scraper.service';

describe('UraScraperController', () => {
  let controller: UraScraperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UraScraperController],
      providers: [
        {
          provide: UraScraperService,
          useValue: {
            scrape: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UraScraperController>(UraScraperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
