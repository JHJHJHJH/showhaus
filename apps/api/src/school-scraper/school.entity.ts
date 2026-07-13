import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Point } from 'geojson';
import { SchoolType } from './dtos/school-scrape.dto';

@Entity({ name: 'school' })
@Unique(['name', 'postal'])
export class SchoolEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ name: 'name', default: '' })
  name: string;

  @Column({
    name: 'school_type',
    type: 'enum',
    enum: SchoolType,
  })
  schoolType: SchoolType;

  @Column({ name: 'address', default: '' })
  address: string;

  @Column({ name: 'postal', nullable: true })
  postal: string;

  @Index({ spatial: true })
  @Column({
    name: 'geometry',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  geometry: Point;
}
