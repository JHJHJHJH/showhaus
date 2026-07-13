import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LandContextTileFunctionService } from './land-context-tile-function.service';
import { TilesController } from './tiles.controller';
import { TilesService } from './tiles.service';

@Module({
  imports: [HttpModule],
  controllers: [TilesController],
  providers: [TilesService, LandContextTileFunctionService],
})
export class TilesModule {}
