import { Test, TestingModule } from '@nestjs/testing';
import { LanduseScraperController } from './landuse-scraper.controller';
import { LanduseScraperService } from './landuse-scraper.service';

describe('LanduseScraperController', () => {
  let controller: LanduseScraperController;
  let service: { syncIfUpdated: jest.Mock };

  beforeEach(async () => {
    service = {
      syncIfUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LanduseScraperController],
      providers: [
        {
          provide: LanduseScraperService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<LanduseScraperController>(LanduseScraperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('triggers the landuse scrape', async () => {
    await expect(controller.scrapeLanduse()).resolves.toBe('');
    expect(service.syncIfUpdated).toHaveBeenCalledTimes(1);
  });
});
