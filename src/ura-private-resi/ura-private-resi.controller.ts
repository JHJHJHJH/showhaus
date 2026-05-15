import {
  Controller,
  Body,
  Post,
  Get,
  ParseFloatPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ResponseMessage } from '../decorators/message.decorator';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import {
  URA_PRIVATE_RESI_POST,
  URA_PRIVATE_RESI_GET,
} from '../constants/response.constants';
import { CreateUraPrivateResiDto } from './dtos/create-ura-private-resi.dto';
import { UraPrivateResiEntity } from './ura-private-resi.entity';
import { UraPrivateResiService } from './ura-private-resi.service';
@Controller('ura-private-resi')
export class UraPrivateResiController {
  constructor(private uraPrivateResiService: UraPrivateResiService) {}

  @Post()
  @ResponseMessage(URA_PRIVATE_RESI_POST)
  @UseInterceptors(TransformInterceptor)
  async createUraPrivateResi(@Body() body: CreateUraPrivateResiDto) {
    const uraPrivateResi = plainToClass(UraPrivateResiEntity, body);

    this.uraPrivateResiService.createUraPrivateResi(uraPrivateResi);
  }

  @Get()
  @ResponseMessage(URA_PRIVATE_RESI_GET)
  @UseInterceptors(TransformInterceptor)
  async getTransactionsByBoundingBox(
    @Query('minLon', ParseFloatPipe) minLon: number,
    @Query('minLat', ParseFloatPipe) minLat: number,
    @Query('maxLon', ParseFloatPipe) maxLon: number,
    @Query('maxLat', ParseFloatPipe) maxLat: number,
  ) {
    return this.uraPrivateResiService.getTransactionsByBoundingBox(
      minLon,
      minLat,
      maxLon,
      maxLat,
    );
  }
}
