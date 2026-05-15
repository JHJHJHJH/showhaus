import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'ura_private_resi_transaction_lean',
  expression: `
    SELECT
      tx.id AS transaction_id,
      loc.id AS ura_private_resi_id,
      loc.project AS project,
      loc.street AS street,
      loc.market_segment AS market_segment,
      tx.contract_date AS contract_date,
      tx.price AS price,
      tx.area AS area,
      tx.floor_range AS floor_range,
      tx.no_of_units AS no_of_units,
      tx.property_type AS property_type,
      tx.district AS district,
      tx.type_of_area AS type_of_area,
      tx.type_of_sale AS type_of_sale,
      tx.tenure AS tenure
    FROM "transaction" tx
    INNER JOIN ura_private_resi loc
      ON loc.id = tx.ura_private_resi_id
  `,
})
export class UraPrivateResiTransactionLeanView {
  @ViewColumn({ name: 'transaction_id' })
  transactionId: number;

  @ViewColumn({ name: 'ura_private_resi_id' })
  uraPrivateResiId: number;

  @ViewColumn()
  project: string;

  @ViewColumn()
  street: string;

  @ViewColumn({ name: 'market_segment' })
  marketSegment: string;

  @ViewColumn({ name: 'contract_date' })
  contractDate: string;

  @ViewColumn()
  price: number;

  @ViewColumn()
  area: number;

  @ViewColumn({ name: 'floor_range' })
  floorRange: string;

  @ViewColumn({ name: 'no_of_units' })
  noOfUnits: number;

  @ViewColumn({ name: 'property_type' })
  propertyType: string;

  @ViewColumn()
  district: string;

  @ViewColumn({ name: 'type_of_area' })
  typeOfArea: string;

  @ViewColumn({ name: 'type_of_sale' })
  typeOfSale: string;

  @ViewColumn()
  tenure: string;
}
