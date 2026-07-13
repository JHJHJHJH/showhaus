import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { LANDUSE_SCRAPE_MSG } from '../constants/response.constants';
import { ResponseMessage } from '../decorators/message.decorator';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { LanduseScraperService } from './landuse-scraper.service';

@Controller('landuse-scrape')
export class LanduseScraperController {
  constructor(private readonly landuseScraperService: LanduseScraperService) {}

  @Post()
  @UseInterceptors(TransformInterceptor)
  @ResponseMessage(LANDUSE_SCRAPE_MSG)
  async scrapeLanduse() {
    await this.landuseScraperService.syncIfUpdated();

    return '';
  }
}
