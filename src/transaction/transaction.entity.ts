import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { LocationEntity } from '../location/location.entity';
import { Type, Exclude, Expose, Transform } from 'class-transformer';

@Entity({ name: 'transaction' })
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP ',
  })
  createdAt: Date;

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @Column({ name: 'area', default: 0 })
  area: number;

  @Column({ name: 'floor_range', default: '' })
  floorRange: string;

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @Column({ name: 'no_of_units', default: 0 })
  noOfUnits: number;

  @Column({ name: 'contract_date', default: '' })
  contractDate: string;

  @Transform(({ value }) => parseTypeOfSale(value), { toClassOnly: true })
  @Column({ name: 'type_of_sale', default: 0 })
  typeOfSale: string;

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @Column({ name: 'price', default: 0 })
  price: number;

  @Column({ name: 'property_type', default: '' })
  propertyType: string;

  @Column({ name: 'district', default: 0 })
  district: string;

  @Column({ name: 'type_of_area', default: '' })
  typeOfArea: string;

  @Column({ name: 'tenure', default: 0 })
  tenure: string;

  @ManyToOne(() => LocationEntity, (loc) => loc.transactions)
  @JoinColumn({ name: 'location_id' })
  location: LocationEntity;

  @Column({ name: 'location_id', default: 0, nullable: true })
  locationId: number;
}

const parseTypeOfSale = (val: string): string => {
  if (val === '1') {
    return 'New Sale';
  } else if (val === '2') {
    return 'Sub Sale';
  } else if (val === '3') {
    return 'Resale';
  } else {
    return '';
  }
};

const parseDistrict = (val: string): string => {
  return '';
};
