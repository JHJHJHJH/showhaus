import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { Readable } from 'stream';
import { TilesService } from './tiles.service';

describe('TilesService', () => {
  let service: TilesService;
  let httpService: { get: jest.Mock };
  let configValues: Record<string, string>;

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
    };
    configValues = {
      MARTIN_BASE_URL: 'http://martin:3333/',
      LAND_CONTEXT_TILE_DATASET_VERSION: 'land-v42',
      TILEJSON_CACHE_TTL_MS: '60000',
    };

    service = new TilesService(
      httpService as unknown as HttpService,
      {
        get: jest.fn((key: string) => configValues[key]),
      } as unknown as ConfigService,
    );
  });

  it('rewrites land-context Martin TileJSON tile URLs to the public API route', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          tilejson: '3.0.0',
          name: 'land-context',
          tiles: ['http://martin:3333/land-context/{z}/{x}/{y}'],
          vector_layers: [
            {
              id: 'landuse',
              fields: {
                object_id: 'text',
              },
            },
            {
              id: 'ura-private-resi',
              fields: {
                project: 'text',
              },
            },
          ],
        },
      }),
    );

    await expect(
      service.getTileJson(
        'land-context',
        'https://api.showhouse.app/api/tiles/land-context/{z}/{x}/{y}',
      ),
    ).resolves.toEqual({
      tilejson: '3.0.0',
      name: 'land-context',
      tiles: [
        'https://api.showhouse.app/api/tiles/land-context/{z}/{x}/{y}?v=land-v42',
      ],
      vector_layers: [
        {
          id: 'landuse',
          fields: {
            object_id: 'text',
          },
        },
        {
          id: 'ura-private-resi',
          fields: {
            project: 'text',
          },
        },
      ],
    });

    expect(httpService.get).toHaveBeenCalledWith(
      'http://martin:3333/land-context',
    );
  });

  it('briefly caches raw Martin TileJSON before rewriting public URLs', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          tilejson: '3.0.0',
          name: 'land-context',
          tiles: ['http://martin:3333/land-context/{z}/{x}/{y}'],
        },
      }),
    );

    await service.getTileJson(
      'land-context',
      'https://api.showhouse.app/api/tiles/land-context/{z}/{x}/{y}',
    );
    await service.getTileJson(
      'land-context',
      'https://api.showhouse.app/api/tiles/land-context/{z}/{x}/{y}',
    );

    expect(httpService.get).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown tile sources', async () => {
    for (const source of ['landuse', 'ura-private-resi', 'roads']) {
      await expect(
        service.getTileJson(
          source,
          `https://api.showhouse.app/api/tiles/${source}/{z}/{x}/{y}`,
        ),
      ).rejects.toThrow(`Unsupported tile source: ${source}`);
    }

    expect(httpService.get).not.toHaveBeenCalled();
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

    await expect(
      service.getTile('land-context', 12, 3230, 2031),
    ).resolves.toEqual({
      stream,
      headers: {
        'content-type': 'application/x-protobuf',
        etag: '"tile-etag"',
      },
    });

    expect(httpService.get).toHaveBeenCalledWith(
      'http://martin:3333/land-context/12/3230/2031',
      {
        responseType: 'stream',
        decompress: false,
        headers: {
          Accept:
            'application/vnd.mapbox-vector-tile, application/x-protobuf, */*',
        },
      },
    );
  });
});
