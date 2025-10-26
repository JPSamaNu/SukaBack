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
  page?: number = 1;
  limit?: number = 20;
  generation?: number;
  type?: string;
  search?: string;
  sortBy?: 'id' | 'name' | 'base_experience' = 'id';
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class PokemonDetailDto extends PokemonListDto {
  moves?: Array<{
    name: string;
    learnMethod: string;
    level?: number;
  }>;
  stats?: Array<{
    name: string;
    baseStat: number;
    effort: number;
  }>;
  evolutionChain?: any;
}
