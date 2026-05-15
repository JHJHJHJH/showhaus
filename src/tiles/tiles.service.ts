import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { firstValueFrom } from 'rxjs';
import { IProxiedTile, ITileJson } from './tiles.interface';

@Injectable()
export class TilesService {
  private readonly martinSources = new Map<string, string>([
    ['land-context', 'land-context'],
  ]);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getTileJson(
    source: string,
    tileUrlTemplate: string,
  ): Promise<ITileJson> {
    const martinSource = this.getMartinSource(source);

    const response = await firstValueFrom(
      this.httpService.get<ITileJson>(this.getMartinUrl(martinSource)),
    );

    return {
      ...response.data,
      name: source,
      tiles: [tileUrlTemplate],
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

  private getMartinUrl(path: string): string {
    const martinBaseUrl = this.configService.get<string>('MARTIN_BASE_URL');
    const normalizedBaseUrl = (
      martinBaseUrl ?? 'http://localhost:3333'
    ).replace(/\/+$/, '');

    return `${normalizedBaseUrl}/${path}`;
  }
}
