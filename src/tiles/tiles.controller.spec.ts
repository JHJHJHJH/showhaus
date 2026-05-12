import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { TilesController } from './tiles.controller';
import { TilesService } from './tiles.service';

describe('TilesController', () => {
  let controller: TilesController;
  let service: {
    getLanduseTileJson: jest.Mock;
    getLanduseTile: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getLanduseTileJson: jest.fn(),
      getLanduseTile: jest.fn(),
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
      tiles: ['https://api.showhouse.app/api/tiles/landuse/{z}/{x}/{y}'],
    };
    service.getLanduseTileJson.mockResolvedValue(tileJson);

    await expect(
      controller.getLanduseTileJson({
        headers: {
          'x-forwarded-proto': 'https',
        },
        protocol: 'http',
        originalUrl: '/api/tiles/landuse?cache=1',
        get: jest.fn().mockReturnValue('api.showhouse.app'),
      } as unknown as Request),
    ).resolves.toBe(tileJson);

    expect(service.getLanduseTileJson).toHaveBeenCalledWith(
      'https://api.showhouse.app/api/tiles/landuse/{z}/{x}/{y}',
    );
  });

  it('sets Martin tile headers and returns a streamable tile', async () => {
    const stream = Readable.from([Buffer.from('mvt')]);
    const response = {
      setHeader: jest.fn(),
    } as unknown as Response;

    service.getLanduseTile.mockResolvedValue({
      stream,
      headers: {
        'content-type': 'application/x-protobuf',
        etag: '"tile-etag"',
      },
    });

    const result = await controller.getLanduseTile(12, 3230, 2031, response);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(service.getLanduseTile).toHaveBeenCalledWith(12, 3230, 2031);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/x-protobuf',
    );
    expect(response.setHeader).toHaveBeenCalledWith('etag', '"tile-etag"');
  });
});
