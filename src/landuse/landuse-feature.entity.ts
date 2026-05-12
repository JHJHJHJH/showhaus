import { Geometry } from 'geojson';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { LanduseDatasetVersionEntity } from './landuse-dataset-version.entity';

@Entity({ name: 'landuse_feature' })
@Unique(['datasetVersionId', 'objectId'])
export class LanduseFeatureEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ManyToOne(
    () => LanduseDatasetVersionEntity,
    (datasetVersion) => datasetVersion.features,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'dataset_version_id' })
  datasetVersion: LanduseDatasetVersionEntity;

  @Index()
  @Column({ name: 'dataset_version_id' })
  datasetVersionId: number;

  @Column({ name: 'object_id', default: '' })
  objectId: string;

  @Column({ name: 'lu_desc', default: '' })
  luDesc: string;

  @Column({ name: 'gpr', default: '' })
  gpr: string;

  @Index()
  @Column({ name: 'inc_crc', default: '' })
  incCrc: string;

  @Column({ name: 'fmel_upd_d_raw', default: '' })
  fmelUpdDRaw: string;

  @Column({ name: 'shape_area', type: 'double precision', nullable: true })
  shapeArea: number | null;

  @Column({ name: 'shape_len', type: 'double precision', nullable: true })
  shapeLen: number | null;

  @Column({ name: 'properties', type: 'jsonb', nullable: true })
  properties: Record<string, unknown> | null;

  @Index({ spatial: true })
  @Column({
    name: 'geometry',
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326,
  })
  geometry: Geometry;
}
