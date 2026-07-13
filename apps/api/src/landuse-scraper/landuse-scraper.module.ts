import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LanduseModule } from '../landuse/landuse.module';
import { LanduseScraperController } from './landuse-scraper.controller';
import { LanduseScraperService } from './landuse-scraper.service';

@Module({
  imports: [HttpModule, LanduseModule],
  controllers: [LanduseScraperController],
  providers: [LanduseScraperService],
})
export class LanduseScraperModule {}
