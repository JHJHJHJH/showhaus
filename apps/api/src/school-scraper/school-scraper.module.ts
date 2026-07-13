import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolScraperController } from './school-scraper.controller';
import { SchoolScraperService } from './school-scraper.service';
import { SchoolEntity } from './school.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([SchoolEntity])],
  controllers: [SchoolScraperController],
  providers: [SchoolScraperService],
  exports: [SchoolScraperService],
})
export class SchoolScraperModule {}
