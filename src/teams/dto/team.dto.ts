import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, ValidateNested, IsInt, Min, Max, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPokemonToTeamDto {
  @ApiProperty({
    description: 'ID del Pokémon (Nacional Dex)',
    example: 25,
  })
  @IsInt()
  @Min(1)
  pokemonId: number;

  @ApiProperty({
    description: 'Nombre del Pokémon',
    example: 'Pikachu',
  })
  @IsString()
  @IsNotEmpty()
  pokemonName: string;

  @ApiProperty({
    description: 'Posición en el equipo (1-6)',
    example: 1,
    minimum: 1,
    maximum: 6,
  })
  @IsInt()
  @Min(1)
  @Max(6)
  position: number;

  @ApiPropertyOptional({
    description: 'Apodo personalizado',
    example: 'Rayo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Movimientos del Pokémon (máx 4)',
    example: ['thunderbolt', 'quick-attack', 'iron-tail', 'electro-ball'],
    maxItems: 4,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  moves?: string[];

  @ApiPropertyOptional({
    description: 'Habilidad del Pokémon',
    example: 'static',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ability?: string;

  @ApiPropertyOptional({
    description: 'Item equipado',
    example: 'light-ball',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  item?: string;

  @ApiPropertyOptional({
    description: 'Naturaleza del Pokémon',
    example: 'jolly',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nature?: string;
}

export class CreateTeamDto {
  @ApiProperty({
    description: 'Nombre del equipo',
    example: 'Mi Equipo Competitivo',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del equipo',
    example: 'Equipo balanceado para batallas online',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Lista de Pokémon del equipo (máximo 6)',
    type: [AddPokemonToTeamDto],
    maxItems: 6,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => AddPokemonToTeamDto)
  pokemons?: AddPokemonToTeamDto[];
}

export class UpdateTeamDto {
  @ApiPropertyOptional({
    description: 'Nombre del equipo',
    example: 'Mi Equipo Actualizado',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción del equipo',
    example: 'Equipo actualizado con nuevas estrategias',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateTeamPokemonDto {
  @ApiPropertyOptional({
    description: 'Posición en el equipo (1-6)',
    example: 2,
    minimum: 1,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  position?: number;

  @ApiPropertyOptional({
    description: 'Apodo personalizado',
    example: 'Sparkle',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Movimientos del Pokémon (máx 4)',
    example: ['thunderbolt', 'volt-tackle'],
    maxItems: 4,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  moves?: string[];

  @ApiPropertyOptional({
    description: 'Habilidad del Pokémon',
    example: 'lightning-rod',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ability?: string;

  @ApiPropertyOptional({
    description: 'Item equipado',
    example: 'choice-scarf',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  item?: string;

  @ApiPropertyOptional({
    description: 'Naturaleza del Pokémon',
    example: 'adamant',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nature?: string;
}
