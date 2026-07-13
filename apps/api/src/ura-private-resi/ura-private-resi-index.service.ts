import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class UraPrivateResiIndexService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_ura_private_resi_geometry_geometry_gist
      ON ura_private_resi
      USING gist ((geometry::geometry))
      WHERE geometry IS NOT NULL
    `);
  }
}
