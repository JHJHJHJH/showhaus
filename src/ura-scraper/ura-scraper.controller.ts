import { Controller, Body, Post, UseInterceptors } from '@nestjs/common';
import { SCRAPE_MSG } from '../constants/response.constants';
import { ResponseMessage } from '../decorators/message.decorator';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { ScrapeDto } from './dtos/scrape.dto';
import { UraScraperService } from './ura-scraper.service';

@Controller('scrape')
export class UraScraperController {
  constructor(private uraScraperService: UraScraperService) {}

  @Post()
  @UseInterceptors(TransformInterceptor)
  @ResponseMessage(SCRAPE_MSG)
  scrapeUraApi(@Body() body: ScrapeDto) {
    const r = this.uraScraperService.scrape(body.batch);

    return '';
  }
}
