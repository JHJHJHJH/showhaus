import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { iterateGeoJsonFeatures } from './geojson-feature-stream';

describe('iterateGeoJsonFeatures', () => {
  it('streams features from a GeoJSON file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'landuse-parser-'));
    const filePath = join(directory, 'sample.geojson');

    await writeFile(
      filePath,
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { OBJECTID: 1, LU_DESC: 'Residential' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [103.8, 1.3],
                  [103.81, 1.3],
                  [103.81, 1.31],
                  [103.8, 1.3],
                ],
              ],
            },
          },
          {
            type: 'Feature',
            properties: { OBJECTID: 2, LU_DESC: 'Park' },
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [103.82, 1.32],
                    [103.83, 1.32],
                    [103.83, 1.33],
                    [103.82, 1.32],
                  ],
                ],
              ],
            },
          },
        ],
      }),
    );

    const features = [];
    for await (const feature of iterateGeoJsonFeatures(filePath)) {
      features.push(feature);
    }

    expect(features).toHaveLength(2);
    expect(features[0].properties?.LU_DESC).toBe('Residential');
    expect(features[1].geometry.type).toBe('MultiPolygon');

    await rm(directory, { recursive: true, force: true });
  });
});
