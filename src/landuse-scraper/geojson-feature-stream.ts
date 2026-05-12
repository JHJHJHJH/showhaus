import { createReadStream } from 'fs';
import { Geometry } from 'geojson';

export interface IGeoJsonFeature {
  type: string;
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry: Geometry;
}

export async function* iterateGeoJsonFeatures(
  filePath: string,
): AsyncGenerator<IGeoJsonFeature> {
  const stream = createReadStream(filePath, { encoding: 'utf8' });
  const featuresPattern = /"features"\s*:\s*\[/;
  let buffer = '';
  let foundFeaturesArray = false;
  let collecting = false;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let currentObject = '';

  for await (const chunk of stream) {
    buffer += chunk;

    if (!foundFeaturesArray) {
      const match = featuresPattern.exec(buffer);
      if (match == null) {
        if (buffer.length > 256) {
          buffer = buffer.slice(-256);
        }
        continue;
      }

      foundFeaturesArray = true;
      buffer = buffer.slice(match.index + match[0].length);
    }

    let index = 0;
    while (index < buffer.length) {
      const char = buffer[index];

      if (!collecting) {
        if (char === '{') {
          collecting = true;
          depth = 1;
          currentObject = '{';
        } else if (char === ']') {
          return;
        }

        index += 1;
        continue;
      }

      currentObject += char;

      if (escaped) {
        escaped = false;
        index += 1;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        index += 1;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        index += 1;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          depth += 1;
        } else if (char === '}') {
          depth -= 1;
        }
      }

      if (!inString && depth === 0) {
        yield JSON.parse(currentObject) as IGeoJsonFeature;
        collecting = false;
        currentObject = '';
      }

      index += 1;
    }

    buffer = collecting ? '' : '';
  }

  if (collecting) {
    throw new Error('Unexpected end of GeoJSON feature stream');
  }

  if (!foundFeaturesArray) {
    throw new Error('GeoJSON features array not found');
  }
}
