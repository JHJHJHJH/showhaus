import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from '../transaction/transaction.entity';
import { UraPrivateResiEntity } from './ura-private-resi.entity';
import { UraPrivateResiTileFeatureView } from './ura-private-resi-tile-feature.view';
import { UraPrivateResiTransactionLeanView } from './ura-private-resi-transaction-lean.view';
import { UraPrivateResiService } from './ura-private-resi.service';
import { UraPrivateResiController } from './ura-private-resi.controller';
import { UraPrivateResiIndexService } from './ura-private-resi-index.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UraPrivateResiEntity,
      UraPrivateResiTileFeatureView,
      UraPrivateResiTransactionLeanView,
      TransactionEntity,
    ]),
  ],
  providers: [UraPrivateResiService, UraPrivateResiIndexService],
  exports: [UraPrivateResiService],
  controllers: [UraPrivateResiController],
})
export class UraPrivateResiModule {}
