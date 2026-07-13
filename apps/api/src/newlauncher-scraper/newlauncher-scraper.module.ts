import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewlauncherProjectEntity } from './newlauncher-project.entity';
import { NewlauncherScraperService } from './newlauncher-scraper.service';
import { PlaywrightFetcherService } from './playwright-fetcher.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([NewlauncherProjectEntity])],
  providers: [NewlauncherScraperService, PlaywrightFetcherService],
  exports: [NewlauncherScraperService],
})
export class NewlauncherScraperModule {}
