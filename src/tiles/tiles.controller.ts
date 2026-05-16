import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  TILEJSON_CACHE_CONTROL,
  TilesService,
  VECTOR_TILE_CACHE_CONTROL,
} from './tiles.service';

@Controller('tiles')
export class TilesController {
  constructor(private readonly tilesService: TilesService) {}

  @Get(':source')
  getTileJson(
    @Param('source') source: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', TILEJSON_CACHE_CONTROL);

    return this.tilesService.getTileJson(
      source,
      this.buildPublicTileUrlTemplate(request),
    );
  }

  @Get(':source/:z/:x/:y')
  async getTile(
    @Param('source') source: string,
    @Param('z', ParseIntPipe) z: number,
    @Param('x', ParseIntPipe) x: number,
    @Param('y', ParseIntPipe) y: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tile = await this.tilesService.getTile(source, z, x, y);

    const contentType =
      this.readHeaderValue(tile.headers['content-type']) ??
      'application/vnd.mapbox-vector-tile';
    const cacheControl =
      this.readHeaderValue(tile.headers['cache-control']) ??
      VECTOR_TILE_CACHE_CONTROL;

    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', cacheControl);

    for (const header of [
      'content-encoding',
      'content-length',
      'etag',
      'last-modified',
    ]) {
      const value = this.readHeaderValue(tile.headers[header]);

      if (value != null) {
        response.setHeader(header, value);
      }
    }

    return new StreamableFile(tile.stream);
  }

  private readHeaderValue(
    value: unknown,
  ): string | number | readonly string[] | undefined {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      Array.isArray(value)
    ) {
      return value;
    }

    return undefined;
  }

  private buildPublicTileUrlTemplate(request: Request): string {
    const protoHeader = request.headers['x-forwarded-proto'];
    const forwardedProto = Array.isArray(protoHeader)
      ? protoHeader[0]
      : protoHeader;
    const protocol = forwardedProto ?? request.protocol;
    const host = request.get('host');
    const requestPath = request.originalUrl.split('?')[0].replace(/\/+$/, '');
    const tilePath = `${requestPath}/{z}/{x}/{y}`;

    if (host == null || host === '') {
      return tilePath;
    }

    return `${protocol}://${host}${tilePath}`;
  }
}
