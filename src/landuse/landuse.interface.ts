import { Geometry } from 'geojson';

export interface ILanduseFeatureInput {
  objectId: string;
  luDesc: string;
  gpr: string;
  incCrc: string;
  fmelUpdDRaw: string;
  shapeArea: number | null;
  shapeLen: number | null;
  properties: Record<string, unknown> | null;
  geometry: Geometry;
}

export interface ILanduseDatasetMetadata {
  datasetId: string;
  name: string;
  format: string;
  lastUpdatedAt: string;
  [key: string]: unknown;
}
