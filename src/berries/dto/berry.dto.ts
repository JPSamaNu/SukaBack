import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BerryDto {
  id: number;
  name: string;
  naturalGiftPower: number;
  size: number;
  maxHarvest: number;
  growthTime: number;
  soilDryness: number;
  smoothness: number;
  firmness: string;
  naturalGiftType: string;
  flavors: Array<{
    flavor: string;
    potency: number;
  }>;
  sprite?: string;
}

export class BerryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  firmness?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
