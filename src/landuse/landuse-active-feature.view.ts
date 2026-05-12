import { Geometry } from 'geojson';
import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'landuse_active_feature',
  expression: `
    SELECT
      feature.id AS id,
      feature.object_id AS object_id,
      feature.lu_desc AS lu_desc,
      feature.gpr AS gpr,
      feature.inc_crc AS inc_crc,
      feature.fmel_upd_d_raw AS fmel_upd_d_raw,
      feature.shape_area AS shape_area,
      feature.shape_len AS shape_len,
      dataset_version.upstream_last_updated_at AS upstream_last_updated_at,
      feature.geometry::geometry(Geometry, 4326) AS geometry
    FROM landuse_feature feature
    INNER JOIN landuse_dataset_version dataset_version
      ON dataset_version.id = feature.dataset_version_id
    WHERE dataset_version.is_active = true
      AND dataset_version.status = 'succeeded'
  `,
})
export class LanduseActiveFeatureView {
  @ViewColumn()
  id: number;

  @ViewColumn({ name: 'object_id' })
  objectId: string;

  @ViewColumn({ name: 'lu_desc' })
  luDesc: string;

  @ViewColumn()
  gpr: string;

  @ViewColumn({ name: 'inc_crc' })
  incCrc: string;

  @ViewColumn({ name: 'fmel_upd_d_raw' })
  fmelUpdDRaw: string;

  @ViewColumn({ name: 'shape_area' })
  shapeArea: number | null;

  @ViewColumn({ name: 'shape_len' })
  shapeLen: number | null;

  @ViewColumn({ name: 'upstream_last_updated_at' })
  upstreamLastUpdatedAt: Date;

  @ViewColumn()
  geometry: Geometry;
}
