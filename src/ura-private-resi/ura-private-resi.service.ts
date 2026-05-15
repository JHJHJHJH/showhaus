import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UraPrivateResiEntity } from './ura-private-resi.entity';
import { IUraPrivateResi } from './ura-private-resi.interface';

export interface UraPrivateResiTransactionRow {
  transaction_id: number;
  ura_private_resi_id: number;
  project: string;
  street: string;
  market_segment: string;
  contract_date: string;
  price: number;
  area: number;
  floor_range: string;
  no_of_units: number;
  property_type: string;
  district: string;
  type_of_area: string;
  type_of_sale: string;
  tenure: string;
}

@Injectable()
export class UraPrivateResiService {
  private readonly logger = new Logger(UraPrivateResiService.name);

  constructor(
    @InjectRepository(UraPrivateResiEntity)
    private readonly uraPrivateResiRepository: Repository<UraPrivateResiEntity>,
  ) {}

  async createUraPrivateResi(uraPrivateResi: IUraPrivateResi) {
    const saved = await this.uraPrivateResiRepository.save(uraPrivateResi);
    return saved;
  }

  async findUraPrivateResiByParam(uraPrivateResi: IUraPrivateResi) {
    const condition = {
      project: `${uraPrivateResi.project}`,
      street: `${uraPrivateResi.street}`,
      x: uraPrivateResi.x,
      y: uraPrivateResi.y,
    };
    const ura_private_resi_db = await this.uraPrivateResiRepository.find({
      where: condition,
    });

    // this.logger.log(
    //   `[ findUraPrivateResiByParam ] Found ${ura_private_resi_db.length} ura-private-resis.`,
    // );
    return ura_private_resi_db;
  }

  async findUraPrivateResiByBoundingBox(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
  ) {
    const ura_private_resi_db = await this.uraPrivateResiRepository
      .createQueryBuilder('ura_private_resi')
      .innerJoinAndSelect('ura_private_resi.transactions', 'tx')
      .where(
        `ura_private_resi.coordinates && ST_Transform( ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 4326)`,
      )
      .getMany();

    this.logger.log(
      `[ findUraPrivateResiByBoundingBox ] Found ${ura_private_resi_db.length} ura-private-resis.`,
    );
    return ura_private_resi_db;
  }

  async getTransactionsByBoundingBox(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
  ): Promise<UraPrivateResiTransactionRow[]> {
    return this.uraPrivateResiRepository.query(
      `
        SELECT lean.*
        FROM ura_private_resi_transaction_lean lean
        INNER JOIN ura_private_resi loc
          ON loc.id = lean.ura_private_resi_id
        WHERE loc.geometry::geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        ORDER BY
          CASE
            WHEN lean.contract_date ~ '^[0-9]{4}$'
            THEN to_date(lean.contract_date, 'MMyy')
            ELSE NULL
          END DESC NULLS LAST,
          lean.transaction_id DESC
      `,
      [minLon, minLat, maxLon, maxLat],
    );
  }
}
