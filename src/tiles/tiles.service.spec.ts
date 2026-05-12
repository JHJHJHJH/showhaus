import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { Readable } from 'stream';
import { TilesService } from './tiles.service';

describe('TilesService', () => {
  let service: TilesService;
  let httpService: { get: jest.Mock };

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
    };

    service = new TilesService(
      httpService as unknown as HttpService,
      {
        get: jest.fn().mockReturnValue('http://martin:3333/'),
      } as unknown as ConfigService,
    );
  });

  it('rewrites Martin TileJSON tile URLs to the public API route', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          tilejson: '3.0.0',
          tiles: ['http://martin:3333/landuse/{z}/{x}/{y}'],
          vector_layers: [
            {
              id: 'landuse',
              fields: {
                object_id: 'text',
              },
            },
          ],
        },
      }),
    );

    await expect(
      service.getLanduseTileJson(
        'https://api.showhouse.app/api/tiles/landuse/{z}/{x}/{y}',
      ),
    ).resolves.toEqual({
      tilejson: '3.0.0',
      tiles: ['https://api.showhouse.app/api/tiles/landuse/{z}/{x}/{y}'],
      vector_layers: [
        {
          id: 'landuse',
          fields: {
            object_id: 'text',
          },
        },
      ],
    });

    expect(httpService.get).toHaveBeenCalledWith('http://martin:3333/landuse');
  });

  it('passes through the Martin MVT stream and response headers', async () => {
    const stream = Readable.from([Buffer.from('mvt')]);

    httpService.get.mockReturnValue(
      of({
        data: stream,
        headers: {
          'content-type': 'application/x-protobuf',
          etag: '"tile-etag"',
        },
      }),
    );

    await expect(service.getLanduseTile(12, 3230, 2031)).resolves.toEqual({
      stream,
      headers: {
        'content-type': 'application/x-protobuf',
        etag: '"tile-etag"',
      },
    });

    expect(httpService.get).toHaveBeenCalledWith(
      'http://martin:3333/landuse/12/3230/2031',
      {
        responseType: 'stream',
        headers: {
          Accept:
            'application/vnd.mapbox-vector-tile, application/x-protobuf, */*',
        },
      },
    );
  });
});
