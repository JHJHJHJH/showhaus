import { Readable } from 'stream';

export interface ITileJsonVectorLayer {
  id: string;
  fields?: Record<string, string>;
  [key: string]: unknown;
}

export interface ITileJson {
  tilejson?: string;
  name?: string;
  description?: string;
  tiles?: string[];
  vector_layers?: ITileJsonVectorLayer[];
  [key: string]: unknown;
}

export interface IProxiedTile {
  stream: Readable;
  headers: Record<string, unknown>;
}
