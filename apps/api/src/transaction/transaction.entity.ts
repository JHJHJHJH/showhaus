import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UraPrivateResiEntity } from '../ura-private-resi/ura-private-resi.entity';
import { Transform } from 'class-transformer';

@Entity({ name: 'transaction' })
@Index(['uraPrivateResiId'])
@Index(['uraPrivateResiId', 'price', 'floorRange', 'area'])
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

  @ManyToOne(() => UraPrivateResiEntity, (loc) => loc.transactions)
  @JoinColumn({ name: 'ura_private_resi_id' })
  uraPrivateResi: UraPrivateResiEntity;

  @Column({ name: 'ura_private_resi_id', default: 0, nullable: true })
  uraPrivateResiId: number;
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
