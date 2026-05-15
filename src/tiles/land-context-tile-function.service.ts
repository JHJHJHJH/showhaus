import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class LandContextTileFunctionService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION public.land_context(z integer, x integer, y integer)
      RETURNS bytea AS $$
        WITH bounds AS (
          SELECT
            ST_TileEnvelope(z, x, y) AS geom_3857,
            ST_Transform(ST_TileEnvelope(z, x, y), 4326) AS geom_4326
        ),
        landuse_mvt AS (
          SELECT ST_AsMVT(tile, 'landuse', 4096, 'geom') AS mvt
          FROM (
            SELECT
              feature.id,
              feature.object_id,
              feature.lu_desc,
              feature.gpr,
              feature.inc_crc,
              feature.fmel_upd_d_raw,
              feature.shape_area,
              feature.shape_len,
              feature.upstream_last_updated_at,
              ST_AsMVTGeom(
                ST_Transform(ST_CurveToLine(feature.geometry), 3857),
                bounds.geom_3857,
                4096,
                64,
                true
              ) AS geom
            FROM public.landuse_active_feature feature
            CROSS JOIN bounds
            WHERE feature.geometry && bounds.geom_4326
          ) tile
          WHERE tile.geom IS NOT NULL
        ),
        ura_private_resi_mvt AS (
          SELECT ST_AsMVT(tile, 'ura-private-resi', 4096, 'geom') AS mvt
          FROM (
            SELECT
              feature.ura_private_resi_id,
              feature.project,
              feature.street,
              feature.market_segment,
              feature.transaction_count,
              feature.price_min,
              feature.price_max,
              feature.price_avg,
              feature.price_p10,
              feature.price_p50,
              feature.price_p90,
              feature.latest_contract_date,
              feature.latest_price,
              ST_AsMVTGeom(
                ST_Transform(feature.geometry, 3857),
                bounds.geom_3857,
                4096,
                64,
                true
              ) AS geom
            FROM public.ura_private_resi_tile_feature feature
            CROSS JOIN bounds
            WHERE feature.geometry && bounds.geom_4326
          ) tile
          WHERE tile.geom IS NOT NULL
        ),
        school_mvt AS (
          SELECT ST_AsMVT(tile, 'school', 4096, 'geom') AS mvt
          FROM (
            SELECT
              id,
              name,
              school_type,
              address,
              postal,
              ST_AsMVTGeom(
                ST_Transform(geometry, 3857),
                bounds.geom_3857,
                4096,
                64,
                true
              ) AS geom
            FROM public.school
            CROSS JOIN bounds
            WHERE geometry && bounds.geom_4326
          ) tile
          WHERE tile.geom IS NOT NULL
        )
        SELECT
          COALESCE((SELECT mvt FROM landuse_mvt), ''::bytea) ||
          COALESCE((SELECT mvt FROM ura_private_resi_mvt), ''::bytea) ||
          COALESCE((SELECT mvt FROM school_mvt), ''::bytea)
      $$ LANGUAGE sql STABLE STRICT PARALLEL SAFE;
    `);

    await this.dataSource.query(`
      COMMENT ON FUNCTION public.land_context(integer, integer, integer) IS $tilejson$
      {
        "description": "Land context tiles containing active land use, URA private residential, and school layers.",
        "vector_layers": [
          {
            "id": "landuse",
            "fields": {
              "id": "int4",
              "object_id": "text",
              "lu_desc": "text",
              "gpr": "text",
              "inc_crc": "text",
              "fmel_upd_d_raw": "text",
              "shape_area": "float8",
              "shape_len": "float8",
              "upstream_last_updated_at": "timestamp"
            }
          },
          {
            "id": "ura-private-resi",
            "fields": {
              "ura_private_resi_id": "int4",
              "project": "text",
              "street": "text",
              "market_segment": "text",
              "transaction_count": "int4",
              "price_min": "int4",
              "price_max": "int4",
              "price_avg": "float8",
              "price_p10": "float8",
              "price_p50": "float8",
              "price_p90": "float8",
              "latest_contract_date": "text",
              "latest_price": "int4"
            }
          },
          {
            "id": "school",
            "fields": {
              "id": "int4",
              "name": "text",
              "school_type": "text",
              "address": "text",
              "postal": "text"
            }
          }
        ]
      }
      $tilejson$;
    `);
  }
}
