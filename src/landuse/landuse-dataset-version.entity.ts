import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LanduseFeatureEntity } from './landuse-feature.entity';

export type LanduseDatasetVersionStatus =
  | 'processing'
  | 'succeeded'
  | 'failed';

@Entity({ name: 'landuse_dataset_version' })
@Index(['datasetId', 'upstreamLastUpdatedAt'], { unique: true })
export class LanduseDatasetVersionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'started_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'dataset_id' })
  datasetId: string;

  @Column({ name: 'dataset_name', default: '' })
  datasetName: string;

  @Column({ name: 'format', default: '' })
  format: string;

  @Column({ name: 'upstream_last_updated_at', type: 'timestamp' })
  upstreamLastUpdatedAt: Date;

  @Column({ name: 'raw_metadata', type: 'jsonb', nullable: true })
  rawMetadata: Record<string, unknown> | null;

  @Column({ name: 'feature_count', type: 'integer', default: 0 })
  featureCount: number;

  @Column({ name: 'status', default: 'processing' })
  status: LanduseDatasetVersionStatus;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @Column({ name: 'error_message', type: 'text', default: '' })
  errorMessage: string;

  @OneToMany(() => LanduseFeatureEntity, (feature) => feature.datasetVersion)
  features: LanduseFeatureEntity[];
}
