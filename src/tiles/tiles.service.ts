import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { firstValueFrom } from 'rxjs';
import { IProxiedTile, ITileJson } from './tiles.interface';

@Injectable()
export class TilesService {
  private readonly sourceId = 'landuse';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getLanduseTileJson(tileUrlTemplate: string): Promise<ITileJson> {
    const response = await firstValueFrom(
      this.httpService.get<ITileJson>(this.getMartinUrl(this.sourceId)),
    );

    return {
      ...response.data,
      tiles: [tileUrlTemplate],
    };
  }

  async getLanduseTile(z: number, x: number, y: number): Promise<IProxiedTile> {
    const response = await firstValueFrom(
      this.httpService.get<Readable>(
        this.getMartinUrl(`${this.sourceId}/${z}/${x}/${y}`),
        {
          responseType: 'stream',
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

  private getMartinUrl(path: string): string {
    const martinBaseUrl = this.configService.get<string>('MARTIN_BASE_URL');
    const normalizedBaseUrl = (
      martinBaseUrl ?? 'http://localhost:3333'
    ).replace(/\/+$/, '');

    return `${normalizedBaseUrl}/${path}`;
  }
}
