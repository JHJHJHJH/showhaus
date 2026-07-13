import { Point } from 'geojson';
import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'newlauncher_project' })
@Unique(['externalId'])
export class NewlauncherProjectEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'external_id' })
  externalId: string;

  @Column({ name: 'url' })
  url: string;

  @Column({ name: 'name', default: '' })
  name: string;

  @Column({ name: 'district', default: '' })
  district: string;

  @Column({ name: 'property_type', default: '' })
  propertyType: string;

  @Column({ name: 'expected_top', default: '' })
  expectedTop: string;

  @Column({ name: 'project_info', type: 'jsonb', default: () => "'{}'" })
  projectInfo: Record<string, string>;

  @Column({ name: 'facilities', type: 'jsonb', default: () => "'[]'" })
  facilities: string[];

  @Column({
    name: 'essential_amenities',
    type: 'jsonb',
    default: () => "'[]'",
  })
  essentialAmenities: Record<string, string>[];

  @Column({ name: 'unit_mix', type: 'jsonb', default: () => "'[]'" })
  unitMix: Record<string, string>[];

  @Column({ name: 'balance_units', type: 'jsonb', default: () => "'[]'" })
  balanceUnits: Record<string, string>[];

  @Column({ name: 'floor_plans', type: 'jsonb', default: () => "'[]'" })
  floorPlans: unknown[];

  @Column({ name: 'documents', type: 'jsonb', default: () => "'{}'" })
  documents: Record<string, unknown>;

  @Index({ spatial: true })
  @Column({
    name: 'geometry',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geometry: Point;
}
