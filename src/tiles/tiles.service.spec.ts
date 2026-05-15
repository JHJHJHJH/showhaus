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
      tiles: ['https://api.showhouse.app/api/tiles/land-context/{z}/{x}/{y}'],
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
