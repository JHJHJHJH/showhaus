import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanduseDatasetVersionEntity } from './landuse-dataset-version.entity';
import { LanduseFeatureEntity } from './landuse-feature.entity';
import { LanduseService } from './landuse.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LanduseDatasetVersionEntity,
      LanduseFeatureEntity,
    ]),
  ],
  providers: [LanduseService],
  exports: [LanduseService],
})
export class LanduseModule {}
