import {
  Controller,
  Body,
  Post,
  Get,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ResponseMessage } from '../decorators/message.decorator';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { LOCATION_POST, LOCATIONS_GET } from '../constants/response.constants';
import { CreateLocationDto } from './dtos/create-location.dto';
import { LocationEntity } from './location.entity';
import { LocationService } from './location.service';
@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Post()
  @ResponseMessage(LOCATION_POST)
  @UseInterceptors(TransformInterceptor)
  async createLocation(@Body() body: CreateLocationDto) {
    const location = plainToClass(LocationEntity, body);

    this.locationService.createLocation(location);
  }

  @Get()
  @ResponseMessage(LOCATIONS_GET)
  @UseInterceptors(TransformInterceptor)
  async getGeojsonByBoundingBox(
    @Query('minLon') minLon: number,
    @Query('minLat') minLat: number,
    @Query('maxLon') maxLon: number,
    @Query('maxLat') maxLat: number,
  ) {
    return this.locationService.getTransactionsGeojson(
      minLon,
      minLat,
      maxLon,
      maxLat,
    );
  }
}
