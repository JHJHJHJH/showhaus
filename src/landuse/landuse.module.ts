import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanduseActiveFeatureView } from './landuse-active-feature.view';
import { LanduseDatasetVersionEntity } from './landuse-dataset-version.entity';
import { LanduseFeatureEntity } from './landuse-feature.entity';
import { LanduseService } from './landuse.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LanduseActiveFeatureView,
      LanduseDatasetVersionEntity,
      LanduseFeatureEntity,
    ]),
  ],
  providers: [LanduseService],
  exports: [LanduseService],
})
export class LanduseModule {}
