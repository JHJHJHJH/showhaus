import { Controller, Get, Post, Query } from '@nestjs/common';
import { SchoolScraperService } from './school-scraper.service';
import { SchoolScrapeDto } from './dtos/school-scrape.dto';

@Controller('school-scrape')
export class SchoolScraperController {
  constructor(private readonly schoolScraperService: SchoolScraperService) {}

  @Post()
  async scrape(@Query() query: SchoolScrapeDto) {
    this.schoolScraperService.scrape(query).catch((error) => {
      // Background task errors should be caught and logged
    });
    return { message: 'school-scrape started' };
  }
}
