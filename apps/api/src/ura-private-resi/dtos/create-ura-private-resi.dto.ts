import { IsNumber, IsString } from 'class-validator';

export class CreateUraPrivateResiDto {
  @IsString()
  street: string;
  @IsNumber()
  x: number;
  @IsNumber()
  y: number;
  @IsString()
  project: string;

  @IsString()
  marketSegment: string;
}
