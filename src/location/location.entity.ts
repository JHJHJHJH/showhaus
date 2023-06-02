import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Geometry, Point, Position } from 'geojson';
import { TransactionEntity } from '../transaction/transaction.entity';
import { Expose, Transform, Type } from 'class-transformer';
import * as proj4 from 'proj4';

@Entity({ name: 'location' })
@Unique(['project', 'street', 'x', 'y'])
export class LocationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP ',
  })
  createdAt: Date;

  @Column({ name: 'market_segment', default: '' })
  marketSegment: string;

  @Column({ name: 'project', default: '' })
  project: string;

  @Column({ name: 'street', default: '' })
  street: string;

  @Expose({ name: 'transaction' })
  @Type(() => TransactionEntity)
  @OneToMany(() => TransactionEntity, (tx) => tx.location)
  transactions: TransactionEntity[];

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @Column({ name: 'x', default: 0 })
  x: number;

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @Column({ name: 'y', default: 0 })
  y: number;

  coordinates: Point;
  @Expose()
  @Index({ spatial: true })
  @Column({
    name: 'geometry',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  get _coordinates(): Point {
    return this.coordinates;
  }
  set _coordinates(value: any) {
    this.coordinates = parseCoordinates(this.x, this.y);
  }
}

const parseCoordinates = (x: number, y: number): Point => {
  if (x === undefined || y === undefined) {
    return undefined;
  }
  const fromProjection = 'EPSG:3414';
  const toProjection =
    '+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs';
  proj4.defs(fromProjection, toProjection);
  const coords: number[] = proj4(toProjection).inverse([x, y]);
  // const coords = [x,y];
  const pt: Point = {
    type: 'Point',
    coordinates: coords,
  };
  return pt;
};
