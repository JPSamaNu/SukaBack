import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pokemon } from './entities/pokemon.entity';
import { PokemonQueryDto, PokemonListDto, PokemonDetailDto } from './dto/pokemon.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
  ) {}

  /**
   * Obtener lista completa de Pokemon con paginación y filtros
   */
  async findAll(query: PokemonQueryDto): Promise<{
    data: PokemonListDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, generation, type, search, sortBy = 'id', sortOrder = 'ASC' } = query;
    const skip = (page - 1) * limit;

    // Query base con joins para obtener información completa
    let queryBuilder = this.pokemonRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('pokemon_v2_pokemonspecies', 'ps', 'p.pokemon_species_id = ps.id')
      .leftJoinAndSelect('pokemon_v2_generation', 'g', 'ps.generation_id = g.id')
      .where('p.is_default = :isDefault', { isDefault: true });

    // Filtro por generación
    if (generation) {
      queryBuilder.andWhere('ps.generation_id = :generation', { generation });
    }

    // Filtro por búsqueda de nombre
    if (search) {
      queryBuilder.andWhere('(p.name ILIKE :search OR ps.name ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Ordenamiento
    const orderByField = sortBy === 'id' ? 'p.id' : sortBy === 'name' ? 'p.name' : 'p.base_experience';
    queryBuilder.orderBy(orderByField, sortOrder);

    // Obtener total y datos paginados
    const [results, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Transformar resultados
    const data = await Promise.all(
      results.map(async (pokemon) => this.transformToPokemonList(pokemon)),
    );

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener todos los Pokemon sin paginación (para el frontend)
   */
  async findAllNoPagination(): Promise<PokemonListDto[]> {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.base_experience as "baseExperience",
        p.height,
        p.weight,
        ps.id as "speciesId",
        ps.name as "speciesName",
        ps.generation_id as "generationId",
        g.name as "generationName"
      FROM pokemon_v2_pokemon p
      INNER JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
      INNER JOIN pokemon_v2_generation g ON ps.generation_id = g.id
      WHERE p.is_default = true
      ORDER BY p.id
    `;

    const results = await this.pokemonRepository.query(query);
    
    // Agregar sprites para cada Pokemon
    return Promise.all(results.map(async (pokemon: any) => {
      const sprites = await this.getPokemonSprites(pokemon.id);
      return {
        ...pokemon,
        sprites,
      };
    }));
  }

  /**
   * Obtener Pokemon por ID con información detallada
   */
  async findOne(id: number): Promise<PokemonDetailDto> {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.base_experience as "baseExperience",
        p.height,
        p.weight,
        ps.id as "speciesId",
        ps.name as "speciesName",
        ps.generation_id as "generationId",
        g.name as "generationName"
      FROM pokemon_v2_pokemon p
      INNER JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
      INNER JOIN pokemon_v2_generation g ON ps.generation_id = g.id
      WHERE p.id = $1 AND p.is_default = true
    `;

    const [pokemon] = await this.pokemonRepository.query(query, [id]);

    if (!pokemon) {
      throw new NotFoundException(`Pokemon con ID ${id} no encontrado`);
    }

    // Obtener información adicional
    const [types, abilities, stats, sprites] = await Promise.all([
      this.getPokemonTypes(id),
      this.getPokemonAbilities(id),
      this.getPokemonStats(id),
      this.getPokemonSprites(id),
    ]);

    return {
      ...pokemon,
      types,
      abilities,
      stats,
      sprites,
    };
  }

  /**
   * Obtener tipos de un Pokemon
   */
  private async getPokemonTypes(pokemonId: number): Promise<string[]> {
    const query = `
      SELECT t.name
      FROM pokemon_v2_pokemontype pt
      INNER JOIN pokemon_v2_type t ON pt.type_id = t.id
      WHERE pt.pokemon_id = $1
      ORDER BY pt.slot
    `;
    const results = await this.pokemonRepository.query(query, [pokemonId]);
    return results.map((r: any) => r.name);
  }

  /**
   * Obtener habilidades de un Pokemon
   */
  private async getPokemonAbilities(pokemonId: number): Promise<string[]> {
    const query = `
      SELECT a.name
      FROM pokemon_v2_pokemonability pa
      INNER JOIN pokemon_v2_ability a ON pa.ability_id = a.id
      WHERE pa.pokemon_id = $1
      ORDER BY pa.slot
    `;
    const results = await this.pokemonRepository.query(query, [pokemonId]);
    return results.map((r: any) => r.name);
  }

  /**
   * Obtener estadísticas de un Pokemon
   */
  private async getPokemonStats(pokemonId: number): Promise<Array<{ name: string; baseStat: number; effort: number }>> {
    const query = `
      SELECT 
        s.name,
        ps.base_stat as "baseStat",
        ps.effort
      FROM pokemon_v2_pokemonstat ps
      INNER JOIN pokemon_v2_stat s ON ps.stat_id = s.id
      WHERE ps.pokemon_id = $1
      ORDER BY s.id
    `;
    return this.pokemonRepository.query(query, [pokemonId]);
  }

  /**
   * Obtener sprites de un Pokemon
   */
  private async getPokemonSprites(pokemonId: number): Promise<any> {
    const query = `
      SELECT sprites
      FROM pokemon_v2_pokemonsprites
      WHERE pokemon_id = $1
      LIMIT 1
    `;
    const [result] = await this.pokemonRepository.query(query, [pokemonId]);
    return result?.sprites || null;
  }

  /**
   * Transformar entidad Pokemon a DTO
   */
  private async transformToPokemonList(pokemon: Pokemon): Promise<PokemonListDto> {
    const [types, sprites] = await Promise.all([
      this.getPokemonTypes(pokemon.id),
      this.getPokemonSprites(pokemon.id),
    ]);

    return {
      id: pokemon.id,
      name: pokemon.name,
      baseExperience: pokemon.baseExperience,
      height: pokemon.height,
      weight: pokemon.weight,
      speciesId: pokemon.pokemonSpeciesId,
      speciesName: pokemon.name,
      generationId: 1,
      generationName: 'generation-i',
      types,
      sprites,
    };
  }

  /**
   * Obtener total de Pokemon en la base de datos
   */
  async getTotalCount(): Promise<number> {
    return this.pokemonRepository.count({ where: { isDefault: true } });
  }

  /**
   * Obtener Pokemon por generación
   */
  async findByGeneration(generation: number): Promise<PokemonListDto[]> {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.base_experience as "baseExperience",
        p.height,
        p.weight,
        ps.id as "speciesId",
        ps.name as "speciesName",
        ps.generation_id as "generationId",
        g.name as "generationName"
      FROM pokemon_v2_pokemon p
      INNER JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
      INNER JOIN pokemon_v2_generation g ON ps.generation_id = g.id
      WHERE p.is_default = true AND ps.generation_id = $1
      ORDER BY p.id
    `;

    const results = await this.pokemonRepository.query(query, [generation]);
    
    return Promise.all(results.map(async (pokemon: any) => {
      const sprites = await this.getPokemonSprites(pokemon.id);
      const types = await this.getPokemonTypes(pokemon.id);
      return {
        ...pokemon,
        types,
        sprites,
      };
    }));
  }

  /**
   * Obtener todas las generaciones disponibles
   */
  async getAllGenerations(): Promise<Array<{ id: number; name: string; region: string; pokemonCount: number }>> {
    const query = `
      SELECT 
        g.id,
        g.name,
        gn.name as region,
        COUNT(DISTINCT ps.id) as "pokemonCount"
      FROM pokemon_v2_generation g
      LEFT JOIN pokemon_v2_generationname gn ON g.id = gn.generation_id AND gn.language_id = 9
      LEFT JOIN pokemon_v2_pokemonspecies ps ON ps.generation_id = g.id
      GROUP BY g.id, g.name, gn.name
      ORDER BY g.id
    `;

    return this.pokemonRepository.query(query);
  }

  /**
   * Obtener conteo de Pokemon por generación
   */
  async getGenerationCount(generation: number): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT p.id) as count
      FROM pokemon_v2_pokemon p
      INNER JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
      WHERE p.is_default = true AND ps.generation_id = $1
    `;

    const [result] = await this.pokemonRepository.query(query, [generation]);
    return parseInt(result.count, 10);
  }
}

