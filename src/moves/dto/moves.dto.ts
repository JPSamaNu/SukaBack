import { IsOptional, IsString, IsNumber } from 'class-validator';

export class MovesQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  damageClass?: string;

  @IsOptional()
  @IsNumber()
  generation?: number;
}
