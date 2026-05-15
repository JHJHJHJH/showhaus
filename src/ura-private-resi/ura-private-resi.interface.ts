import { Point } from 'geojson';
import { ITransaction } from '../transaction/transaction.interface';

export interface IUraPrivateResi {
  street: string;
  x: number;
  y: number;
  project: string;
  transactions: ITransaction[];
  marketSegment: string;
  coordinates: Point;
}
