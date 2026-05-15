import { Point } from 'geojson';
import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'ura_private_resi_tile_feature',
  expression: `
    WITH tx_stats AS MATERIALIZED (
      SELECT
        tx.ura_private_resi_id AS ura_private_resi_id,
        COUNT(tx.id)::int AS transaction_count,
        MIN(tx.price)::int AS price_min,
        MAX(tx.price)::int AS price_max,
        AVG(tx.price)::float8 AS price_avg,
        percentile_cont(0.1) WITHIN GROUP (ORDER BY tx.price)::float8 AS price_p10,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY tx.price)::float8 AS price_p50,
        percentile_cont(0.9) WITHIN GROUP (ORDER BY tx.price)::float8 AS price_p90
      FROM "transaction" tx
      GROUP BY tx.ura_private_resi_id
    ),
    latest_tx AS MATERIALIZED (
      SELECT DISTINCT ON (latest.ura_private_resi_id)
        latest.ura_private_resi_id AS ura_private_resi_id,
        latest.contract_date AS contract_date,
        latest.price AS price
      FROM "transaction" latest
      ORDER BY
        latest.ura_private_resi_id,
        CASE
          WHEN latest.contract_date ~ '^[0-9]{4}$'
          THEN to_date(latest.contract_date, 'MMyy')
          ELSE NULL
        END DESC NULLS LAST,
        latest.id DESC
    )
    SELECT
      loc.id AS ura_private_resi_id,
      loc.project AS project,
      loc.street AS street,
      loc.market_segment AS market_segment,
      COALESCE(tx_stats.transaction_count, 0)::int AS transaction_count,
      tx_stats.price_min AS price_min,
      tx_stats.price_max AS price_max,
      tx_stats.price_avg AS price_avg,
      tx_stats.price_p10 AS price_p10,
      tx_stats.price_p50 AS price_p50,
      tx_stats.price_p90 AS price_p90,
      latest_tx.contract_date AS latest_contract_date,
      latest_tx.price AS latest_price,
      loc.geometry::geometry(Point, 4326) AS geometry
    FROM ura_private_resi loc
    LEFT JOIN tx_stats
      ON tx_stats.ura_private_resi_id = loc.id
    LEFT JOIN latest_tx
      ON latest_tx.ura_private_resi_id = loc.id
    WHERE loc.geometry IS NOT NULL
  `,
})
export class UraPrivateResiTileFeatureView {
  @ViewColumn({ name: 'ura_private_resi_id' })
  uraPrivateResiId: number;

  @ViewColumn()
  project: string;

  @ViewColumn()
  street: string;

  @ViewColumn({ name: 'market_segment' })
  marketSegment: string;

  @ViewColumn({ name: 'transaction_count' })
  transactionCount: number;

  @ViewColumn({ name: 'price_min' })
  priceMin: number | null;

  @ViewColumn({ name: 'price_max' })
  priceMax: number | null;

  @ViewColumn({ name: 'price_avg' })
  priceAvg: number | null;

  @ViewColumn({ name: 'price_p10' })
  priceP10: number | null;

  @ViewColumn({ name: 'price_p50' })
  priceP50: number | null;

  @ViewColumn({ name: 'price_p90' })
  priceP90: number | null;

  @ViewColumn({ name: 'latest_contract_date' })
  latestContractDate: string | null;

  @ViewColumn({ name: 'latest_price' })
  latestPrice: number | null;

  @ViewColumn()
  geometry: Point;
}
