import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionModule } from 'src/transaction/transaction.module';
import { UraPrivateResiEntity } from '../ura-private-resi/ura-private-resi.entity';
import { UraPrivateResiModule } from '../ura-private-resi/ura-private-resi.module';
import { UraScraperController } from './ura-scraper.controller';
import { UraScraperService } from './ura-scraper.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UraPrivateResiEntity]),
    HttpModule,
    UraPrivateResiModule,
    TransactionModule,
  ],
  controllers: [UraScraperController],
  providers: [UraScraperService],
})
export class UraScraperModule {}
