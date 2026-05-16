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
              feature.shape_area,
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
        ura_private_resi_features AS MATERIALIZED (
          SELECT
            loc.id AS ura_private_resi_id,
            loc.project AS project,
            loc.street AS street,
            loc.market_segment AS market_segment,
            loc.geometry::geometry(Point, 4326) AS geometry
          FROM public.ura_private_resi loc
          CROSS JOIN bounds
          WHERE loc.geometry IS NOT NULL
            AND loc.geometry::geometry && bounds.geom_4326
        ),
        tx_stats AS (
          SELECT
            tx.ura_private_resi_id AS ura_private_resi_id,
            COUNT(tx.id)::int AS transaction_count,
            MIN(tx.price)::int AS price_min,
            (array_agg(tx.area ORDER BY tx.price ASC, tx.id ASC))[1]::int AS price_min_area,
            (array_agg(tx.floor_range ORDER BY tx.price ASC, tx.id ASC))[1] AS price_min_floor,
            MAX(tx.price)::int AS price_max,
            (array_agg(tx.area ORDER BY tx.price DESC, tx.id DESC))[1]::int AS price_max_area,
            (array_agg(tx.floor_range ORDER BY tx.price DESC, tx.id DESC))[1] AS price_max_floor,
            AVG(tx.price)::float8 AS price_avg,
            percentile_cont(0.1) WITHIN GROUP (ORDER BY tx.price)::float8 AS price_p10,
            (array_agg(tx.area ORDER BY tx.price ASC, tx.id ASC))[GREATEST(1, CEIL(COUNT(tx.id) * 0.1)::int)]::int AS price_p10_area,
            (array_agg(tx.floor_range ORDER BY tx.price ASC, tx.id ASC))[GREATEST(1, CEIL(COUNT(tx.id) * 0.1)::int)] AS price_p10_floor,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY tx.price)::float8 AS price_p50,
            (array_agg(tx.area ORDER BY tx.price ASC, tx.id ASC))[GREATEST(1, CEIL(COUNT(tx.id) * 0.5)::int)]::int AS price_p50_area,
            (array_agg(tx.floor_range ORDER BY tx.price ASC, tx.id ASC))[GREATEST(1, CEIL(COUNT(tx.id) * 0.5)::int)] AS price_p50_floor,
            percentile_cont(0.9) WITHIN GROUP (ORDER BY tx.price)::float8 AS price_p90,
            (array_agg(tx.area ORDER BY tx.price ASC, tx.id ASC))[GREATEST(1, CEIL(COUNT(tx.id) * 0.9)::int)]::int AS price_p90_area,
            (array_agg(tx.floor_range ORDER BY tx.price ASC, tx.id ASC))[GREATEST(1, CEIL(COUNT(tx.id) * 0.9)::int)] AS price_p90_floor
          FROM "transaction" tx
          INNER JOIN ura_private_resi_features feature
            ON feature.ura_private_resi_id = tx.ura_private_resi_id
          GROUP BY tx.ura_private_resi_id
        ),
        latest_tx AS (
          SELECT DISTINCT ON (latest.ura_private_resi_id)
            latest.ura_private_resi_id AS ura_private_resi_id,
            latest.contract_date AS contract_date,
            latest.price AS price
          FROM "transaction" latest
          INNER JOIN ura_private_resi_features feature
            ON feature.ura_private_resi_id = latest.ura_private_resi_id
          ORDER BY
            latest.ura_private_resi_id,
            CASE
              WHEN latest.contract_date ~ '^[0-9]{4}$'
              THEN to_date(latest.contract_date, 'MMyy')
              ELSE NULL
            END DESC NULLS LAST,
            latest.id DESC
        ),
        ura_private_resi_mvt AS (
          SELECT ST_AsMVT(tile, 'ura-private-resi', 4096, 'geom') AS mvt
          FROM (
            SELECT
              feature.ura_private_resi_id,
              feature.project,
              feature.street,
              feature.market_segment,
              COALESCE(tx_stats.transaction_count, 0)::int AS transaction_count,
              tx_stats.price_min,
              tx_stats.price_min_area,
              tx_stats.price_min_floor,
              tx_stats.price_max,
              tx_stats.price_max_area,
              tx_stats.price_max_floor,
              tx_stats.price_avg,
              tx_stats.price_p10,
              tx_stats.price_p10_area,
              tx_stats.price_p10_floor,
              tx_stats.price_p50,
              tx_stats.price_p50_area,
              tx_stats.price_p50_floor,
              tx_stats.price_p90,
              tx_stats.price_p90_area,
              tx_stats.price_p90_floor,
              latest_tx.contract_date AS latest_contract_date,
              latest_tx.price AS latest_price,
              ST_AsMVTGeom(
                ST_Transform(feature.geometry, 3857),
                bounds.geom_3857,
                4096,
                64,
                true
              ) AS geom
            FROM ura_private_resi_features feature
            CROSS JOIN bounds
            LEFT JOIN tx_stats
              ON tx_stats.ura_private_resi_id = feature.ura_private_resi_id
            LEFT JOIN latest_tx
              ON latest_tx.ura_private_resi_id = feature.ura_private_resi_id
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
              "shape_area": "float8"
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
              "price_min_area": "int4",
              "price_min_floor": "text",
              "price_max": "int4",
              "price_max_area": "int4",
              "price_max_floor": "text",
              "price_avg": "float8",
              "price_p10": "float8",
              "price_p10_area": "int4",
              "price_p10_floor": "text",
              "price_p50": "float8",
              "price_p50_area": "int4",
              "price_p50_floor": "text",
              "price_p90": "float8",
              "price_p90_area": "int4",
              "price_p90_floor": "text",
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
