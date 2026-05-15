import { getMetadataArgsStorage } from 'typeorm';
import { TransactionEntity } from '../transaction/transaction.entity';
import { UraPrivateResiIndexService } from './ura-private-resi-index.service';
import { UraPrivateResiTileFeatureView } from './ura-private-resi-tile-feature.view';

const getUraPrivateResiTileFeatureSql = (): string => {
  const metadata = getMetadataArgsStorage().tables.find(
    (table) => table.target === UraPrivateResiTileFeatureView,
  );

  return metadata.expression as string;
};

describe('UraPrivateResiTileFeatureView', () => {
  it('exposes the ura-private-resi tile property columns', () => {
    const sql = getUraPrivateResiTileFeatureSql();

    [
      'AS ura_private_resi_id',
      'AS project',
      'AS street',
      'AS market_segment',
      'AS transaction_count',
      'AS price_min',
      'AS price_max',
      'AS price_avg',
      'AS price_p10',
      'AS price_p50',
      'AS price_p90',
      'AS latest_contract_date',
      'AS latest_price',
      'AS geometry',
    ].forEach((columnAlias) => {
      expect(sql).toContain(columnAlias);
    });
  });

  it('precomputes transaction stats and latest transaction without a lateral join', () => {
    const sql = getUraPrivateResiTileFeatureSql();

    expect(sql).toContain('WITH tx_stats AS MATERIALIZED');
    expect(sql).toContain('latest_tx AS MATERIALIZED');
    expect(sql).toContain('SELECT DISTINCT ON (latest.ura_private_resi_id)');
    expect(sql).not.toMatch(/LEFT\s+JOIN\s+LATERAL/i);
  });
});

describe('TransactionEntity indexes', () => {
  it('declares indexes for ura-private-resi joins and scraper duplicate checks', () => {
    const indexColumns = getMetadataArgsStorage()
      .indices.filter((index) => index.target === TransactionEntity)
      .map((index) => index.columns);

    expect(indexColumns).toContainEqual(['uraPrivateResiId']);
    expect(indexColumns).toContainEqual([
      'uraPrivateResiId',
      'price',
      'floorRange',
      'area',
    ]);
  });
});

describe('UraPrivateResiIndexService', () => {
  it('creates the casted geometry GiST helper index on bootstrap', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue(undefined),
    };
    const service = new UraPrivateResiIndexService(dataSource as any);

    await service.onApplicationBootstrap();

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'CREATE INDEX IF NOT EXISTS idx_ura_private_resi_geometry_geometry_gist',
      ),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('USING gist ((geometry::geometry))'),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE geometry IS NOT NULL'),
    );
  });
});
