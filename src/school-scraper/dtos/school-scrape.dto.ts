import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';

export enum SchoolType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  POST_SECONDARY = 'post-secondary',
  MOE_KINDERGARTEN = 'moe-kindergarten',
}

export class SchoolScrapeDto {
  @IsOptional()
  @IsEnum(SchoolType)
  school_type?: SchoolType;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
