import { DataSource } from 'typeorm';
import { LandContextTileFunctionService } from './land-context-tile-function.service';

describe('LandContextTileFunctionService', () => {
  it('creates the land-context MVT function and TileJSON comment', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue(undefined),
    };
    const service = new LandContextTileFunctionService(
      dataSource as unknown as DataSource,
    );

    await service.onApplicationBootstrap();

    expect(dataSource.query).toHaveBeenCalledTimes(2);
    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        'CREATE OR REPLACE FUNCTION public.land_context(z integer, x integer, y integer)',
      ),
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("ST_AsMVT(tile, 'landuse', 4096, 'geom')"),
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        "ST_AsMVT(tile, 'ura-private-resi', 4096, 'geom')",
      ),
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        'COMMENT ON FUNCTION public.land_context(integer, integer, integer)',
      ),
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('"id": "landuse"'),
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('"id": "ura-private-resi"'),
    );
  });
});
