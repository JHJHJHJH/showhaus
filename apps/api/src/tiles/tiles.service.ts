import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { firstValueFrom } from 'rxjs';
import { IProxiedTile, ITileJson } from './tiles.interface';

export const TILEJSON_CACHE_CONTROL =
  'public, max-age=60, stale-while-revalidate=300';
export const VECTOR_TILE_CACHE_CONTROL =
  'public, max-age=300, stale-while-revalidate=86400';

interface ITileJsonCacheEntry {
  expiresAt: number;
  data: ITileJson;
}

@Injectable()
export class TilesService {
  private readonly martinSources = new Map<string, string>([
    ['land-context', 'land-context'],
  ]);
  private readonly tileJsonCache = new Map<string, ITileJsonCacheEntry>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getTileJson(
    source: string,
    tileUrlTemplate: string,
  ): Promise<ITileJson> {
    const martinSource = this.getMartinSource(source);
    const tileJson = await this.getMartinTileJson(martinSource);

    return {
      ...tileJson,
      name: source,
      tiles: [
        this.appendQueryParam(
          tileUrlTemplate,
          'v',
          this.getDatasetVersion(source),
        ),
      ],
    };
  }

  async getTile(
    source: string,
    z: number,
    x: number,
    y: number,
  ): Promise<IProxiedTile> {
    const martinSource = this.getMartinSource(source);

    const response = await firstValueFrom(
      this.httpService.get<Readable>(
        this.getMartinUrl(`${martinSource}/${z}/${x}/${y}`),
        {
          responseType: 'stream',
          decompress: false,
          headers: {
            Accept:
              'application/vnd.mapbox-vector-tile, application/x-protobuf, */*',
          },
        },
      ),
    );

    return {
      stream: response.data,
      headers: response.headers,
    };
  }

  private getMartinSource(source: string): string {
    const martinSource = this.martinSources.get(source);

    if (martinSource == null) {
      throw new BadRequestException(`Unsupported tile source: ${source}`);
    }

    return martinSource;
  }

  private async getMartinTileJson(martinSource: string): Promise<ITileJson> {
    const now = Date.now();
    const cached = this.tileJsonCache.get(martinSource);

    if (cached != null && cached.expiresAt > now) {
      return cached.data;
    }

    const response = await firstValueFrom(
      this.httpService.get<ITileJson>(this.getMartinUrl(martinSource)),
    );

    this.tileJsonCache.set(martinSource, {
      data: response.data,
      expiresAt: now + this.getTileJsonCacheTtlMs(),
    });

    return response.data;
  }

  private getTileJsonCacheTtlMs(): number {
    const configuredTtl = Number(
      this.configService.get<string>('TILEJSON_CACHE_TTL_MS'),
    );

    return Number.isFinite(configuredTtl) && configuredTtl > 0
      ? configuredTtl
      : 60_000;
  }

  private getDatasetVersion(source: string): string {
    const sourceConfigKey = `${source
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()}_TILE_DATASET_VERSION`;

    return (
      this.configService.get<string>(sourceConfigKey) ??
      this.configService.get<string>('TILE_DATASET_VERSION') ??
      '1'
    );
  }

  private getMartinUrl(path: string): string {
    const martinBaseUrl = this.configService.get<string>('MARTIN_BASE_URL');
    const normalizedBaseUrl = (
      martinBaseUrl ?? 'http://localhost:3333'
    ).replace(/\/+$/, '');

    return `${normalizedBaseUrl}/${path}`;
  }

  private appendQueryParam(url: string, key: string, value: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(
      value,
    )}`;
  }
}
