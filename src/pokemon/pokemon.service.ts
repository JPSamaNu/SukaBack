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
    const [types, abilities, stats, sprites, moves, classification] = await Promise.all([
      this.getPokemonTypes(id),
      this.getPokemonAbilities(id),
      this.getPokemonStats(id),
      this.getPokemonSprites(id),
      this.getPokemonMovesByLevel(id),
      this.getPokemonClassification(pokemon.speciesId),
    ]);

    return {
      ...pokemon,
      types,
      abilities,
      stats,
      sprites,
      moves,
      classification,
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
   * Obtener movimientos que aprende por nivel
   */
  private async getPokemonMovesByLevel(pokemonId: number): Promise<Array<{ 
    level: number; 
    name: string; 
    type: string;
    power: number | null;
    accuracy: number | null;
    pp: number;
    damageClass: string;
  }>> {
    const query = `
      SELECT DISTINCT ON (m.id, pm.level)
        pm.level,
        m.name,
        t.name as type,
        m.power,
        m.accuracy,
        m.pp,
        dc.name as "damageClass"
      FROM pokemon_v2_pokemonmove pm
      INNER JOIN pokemon_v2_move m ON pm.move_id = m.id
      INNER JOIN pokemon_v2_type t ON m.type_id = t.id
      INNER JOIN pokemon_v2_movedamageclass dc ON m.move_damage_class_id = dc.id
      INNER JOIN pokemon_v2_movelearnmethod mlm ON pm.move_learn_method_id = mlm.id
      WHERE pm.pokemon_id = $1 
        AND mlm.name = 'level-up'
        AND pm.level IS NOT NULL
      ORDER BY m.id, pm.level, pm.level ASC, m.name
    `;
    
    const results = await this.pokemonRepository.query(query, [pokemonId]);
    
    // Eliminar duplicados manualmente si es necesario
    const uniqueMoves = new Map();
    results.forEach((move: any) => {
      const key = `${move.name}-${move.level}`;
      if (!uniqueMoves.has(key)) {
        uniqueMoves.set(key, move);
      }
    });
    
    return Array.from(uniqueMoves.values()).sort((a, b) => a.level - b.level);
  }

  /**
   * Obtener clasificación del Pokémon (legendario, mítico, bebé, etc.)
   */
  private async getPokemonClassification(speciesId: number): Promise<{
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
  }> {
    // Obtener datos de species
    const speciesQuery = `
      SELECT 
        ps.is_legendary as "isLegendary",
        ps.is_mythical as "isMythical",
        ps.is_baby as "isBaby",
        ps.capture_rate as "captureRate",
        ps.base_happiness as "baseHappiness",
        ps.hatch_counter as "hatchCounter",
        ps.gender_rate as "genderRate",
        gr.name as "growthRate",
        ph.name as habitat,
        pc.name as color,
        psh.name as shape
      FROM pokemon_v2_pokemonspecies ps
      LEFT JOIN pokemon_v2_growthrate gr ON ps.growth_rate_id = gr.id
      LEFT JOIN pokemon_v2_pokemonhabitat ph ON ps.pokemon_habitat_id = ph.id
      LEFT JOIN pokemon_v2_pokemoncolor pc ON ps.pokemon_color_id = pc.id
      LEFT JOIN pokemon_v2_pokemonshape psh ON ps.pokemon_shape_id = psh.id
      WHERE ps.id = $1
    `;
    
    const [species] = await this.pokemonRepository.query(speciesQuery, [speciesId]);
    
    // Obtener grupos de huevo
    const eggGroupsQuery = `
      SELECT eg.name
      FROM pokemon_v2_pokemonegggroup peg
      INNER JOIN pokemon_v2_egggroup eg ON peg.egg_group_id = eg.id
      WHERE peg.pokemon_species_id = $1
    `;
    
    const eggGroupsResults = await this.pokemonRepository.query(eggGroupsQuery, [speciesId]);
    const eggGroups = eggGroupsResults.map((r: any) => r.name);
    
    return {
      ...species,
      eggGroups,
    };
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
        CASE 
          WHEN g.id = 1 THEN 'Kanto'
          WHEN g.id = 2 THEN 'Johto'
          WHEN g.id = 3 THEN 'Hoenn'
          WHEN g.id = 4 THEN 'Sinnoh'
          WHEN g.id = 5 THEN 'Unova'
          WHEN g.id = 6 THEN 'Kalos'
          WHEN g.id = 7 THEN 'Alola'
          WHEN g.id = 8 THEN 'Galar'
          WHEN g.id = 9 THEN 'Paldea'
          ELSE 'Unknown'
        END as region,
        COUNT(DISTINCT ps.id)::integer as "pokemonCount"
      FROM pokemon_v2_generation g
      LEFT JOIN pokemon_v2_pokemonspecies ps ON ps.generation_id = g.id
      GROUP BY g.id, g.name
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

  /**
   * Obtener ubicaciones de captura de un Pokémon
   */
  async getPokemonLocations(pokemonId: number): Promise<any[]> {
    const query = `
      SELECT 
        e.id,
        e.min_level,
        e.max_level,
        la.name as location_area,
        la.game_index as location_area_game_index,
        l.name as location,
        l.id as location_id,
        v.name as version,
        v.id as version_id,
        vg.name as version_group,
        vg.id as version_group_id,
        em.name as encounter_method,
        em.id as encounter_method_id,
        es.rarity,
        g.name as generation
      FROM pokemon_v2_encounter e
      LEFT JOIN pokemon_v2_locationarea la ON e.location_area_id = la.id
      LEFT JOIN pokemon_v2_location l ON la.location_id = l.id
      LEFT JOIN pokemon_v2_encounterslot es ON e.encounter_slot_id = es.id
      LEFT JOIN pokemon_v2_encountermethod em ON es.encounter_method_id = em.id
      LEFT JOIN pokemon_v2_version v ON e.version_id = v.id
      LEFT JOIN pokemon_v2_versiongroup vg ON v.version_group_id = vg.id
      LEFT JOIN pokemon_v2_generation g ON vg.generation_id = g.id
      WHERE e.pokemon_id = $1
      ORDER BY vg.id, v.id, l.id
    `;

    return this.pokemonRepository.query(query, [pokemonId]);
  }
}
