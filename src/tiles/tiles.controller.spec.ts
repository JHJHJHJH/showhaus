import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { TilesController } from './tiles.controller';
import {
  TILEJSON_CACHE_CONTROL,
  TilesService,
  VECTOR_TILE_CACHE_CONTROL,
} from './tiles.service';

describe('TilesController', () => {
  let controller: TilesController;
  let service: {
    getTileJson: jest.Mock;
    getTile: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getTileJson: jest.fn(),
      getTile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TilesController],
      providers: [
        {
          provide: TilesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<TilesController>(TilesController);
  });

  it('builds public TileJSON tile URLs from the incoming API request', async () => {
    const tileJson = {
      tiles: ['https://api.showhouse.app/api/tiles/land-context/{z}/{x}/{y}'],
    };
    service.getTileJson.mockResolvedValue(tileJson);
    const response = {
      setHeader: jest.fn(),
    } as unknown as Response;

    await expect(
      controller.getTileJson('land-context', {
        headers: {
          'x-forwarded-proto': 'https',
        },
        protocol: 'http',
        originalUrl: '/api/tiles/land-context?cache=1',
        get: jest.fn().mockReturnValue('api.showhouse.app'),
      } as unknown as Request, response),
    ).resolves.toBe(tileJson);

    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      TILEJSON_CACHE_CONTROL,
    );
    expect(service.getTileJson).toHaveBeenCalledWith(
      'land-context',
      'https://api.showhouse.app/api/tiles/land-context/{z}/{x}/{y}',
    );
  });

  it('sets Martin tile headers and returns a streamable tile', async () => {
    const stream = Readable.from([Buffer.from('mvt')]);
    const response = {
      setHeader: jest.fn(),
    } as unknown as Response;

    service.getTile.mockResolvedValue({
      stream,
      headers: {
        'content-type': 'application/x-protobuf',
        etag: '"tile-etag"',
      },
    });

    const result = await controller.getTile(
      'land-context',
      12,
      3230,
      2031,
      response,
    );

    expect(result).toBeInstanceOf(StreamableFile);
    expect(service.getTile).toHaveBeenCalledWith(
      'land-context',
      12,
      3230,
      2031,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/x-protobuf',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      VECTOR_TILE_CACHE_CONTROL,
    );
    expect(response.setHeader).toHaveBeenCalledWith('etag', '"tile-etag"');
  });

  it('preserves Martin cache-control when present', async () => {
    const stream = Readable.from([Buffer.from('mvt')]);
    const response = {
      setHeader: jest.fn(),
    } as unknown as Response;

    service.getTile.mockResolvedValue({
      stream,
      headers: {
        'cache-control': 'public, max-age=86400',
      },
    });

    await controller.getTile('land-context', 12, 3230, 2031, response);

    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=86400',
    );
  });
});
