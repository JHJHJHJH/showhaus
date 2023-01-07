import { IsNumber, IsString } from 'class-validator';

export class ScrapeDto {
  @IsNumber()
  batch: number;

  // @IsString()
  // key: string;
}
