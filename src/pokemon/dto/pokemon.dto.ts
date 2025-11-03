import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PokemonListDto {
  id: number;
  name: string;
  baseExperience: number;
  height: number;
  weight: number;
  speciesId: number;
  speciesName: string;
  generationId: number;
  generationName: string;
  types?: string[];
  abilities?: string[];
  sprites?: {
    front_default?: string;
    front_shiny?: string;
    official_artwork?: string;
  };
}

export class PokemonQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(9)
  generation?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['id', 'name', 'base_experience'])
  sortBy?: 'id' | 'name' | 'base_experience' = 'id';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class PokemonDetailDto extends PokemonListDto {
  moves?: Array<{
    level: number;
    name: string;
    type: string;
    power: number | null;
    accuracy: number | null;
    pp: number;
    damageClass: string;
  }>;
  stats?: Array<{
    name: string;
    baseStat: number;
    effort: number;
  }>;
  classification?: {
    isLegendary: boolean;
    isMythical: boolean;
    isBaby: boolean;
    captureRate: number;
    baseHappiness: number;
    hatchCounter: number;
    genderRate: number;
    growthRate: string;
    habitat: string | null;
    color: string;
    shape: string;
    eggGroups: string[];
  };
  evolutionChain?: any;
}
