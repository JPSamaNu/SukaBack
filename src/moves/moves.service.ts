import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pokemon } from '../pokemon/entities/pokemon.entity';
import { MovesQueryDto } from './dto/moves.dto';

@Injectable()
export class MovesService {
  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
  ) {}

  /**
   * Obtener lista de movimientos con filtros y paginación
   */
  async findAll(query: MovesQueryDto) {
    const { page = 1, limit = 20, search, type, damageClass, generation } = query;
    const offset = (page - 1) * limit;

    // Construir query base
    let whereConditions = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Filtro por búsqueda (nombre del movimiento)
    if (search) {
      whereConditions.push(`m.name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por tipo
    if (type) {
      whereConditions.push(`t.name = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    // Filtro por clase de daño
    if (damageClass) {
      whereConditions.push(`dc.name = $${paramIndex}`);
      params.push(damageClass);
      paramIndex++;
    }

    // Filtro por generación
    if (generation) {
      whereConditions.push(`m.generation_id = $${paramIndex}`);
      params.push(generation);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Query para obtener movimientos
    const movesQuery = `
      SELECT 
        m.id,
        m.name,
        m.power,
        m.pp,
        m.accuracy,
        m.priority,
        t.name as type,
        dc.name as damage_class,
        mee.short_effect as effect,
        m.generation_id
      FROM pokemon_v2_move m
      LEFT JOIN pokemon_v2_type t ON m.type_id = t.id
      LEFT JOIN pokemon_v2_movedamageclass dc ON m.move_damage_class_id = dc.id
      LEFT JOIN pokemon_v2_moveeffect me ON m.move_effect_id = me.id
      LEFT JOIN pokemon_v2_moveeffecteffecttext mee ON me.id = mee.move_effect_id AND mee.language_id = 9
      ${whereClause}
      ORDER BY m.id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pokemon_v2_move m
      LEFT JOIN pokemon_v2_type t ON m.type_id = t.id
      LEFT JOIN pokemon_v2_movedamageclass dc ON m.move_damage_class_id = dc.id
      ${whereClause}
    `;

    const countParams = params.slice(0, -2); // Remover limit y offset

    const [moves, countResult] = await Promise.all([
      this.pokemonRepository.query(movesQuery, params),
      this.pokemonRepository.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: moves.map((move: any) => ({
        id: move.id,
        name: move.name,
        power: move.power,
        pp: move.pp,
        accuracy: move.accuracy,
        priority: move.priority,
        type: move.type,
        damageClass: move.damage_class,
        effect: move.effect || 'Sin descripción',
        generationId: move.generation_id,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Obtener detalles de un movimiento por ID
   */
  async findOne(id: number) {
    const moveQuery = `
      SELECT 
        m.id,
        m.name,
        m.power,
        m.pp,
        m.accuracy,
        m.priority,
        m.move_effect_chance,
        t.name as type,
        dc.name as damage_class,
        mee.short_effect as effect,
        mee.effect as detailed_effect,
        m.generation_id,
        mt.name as target,
        mm.ailment_chance,
        mm.category_id,
        mm.crit_rate,
        mm.drain,
        mm.flinch_chance,
        mm.healing,
        mm.max_hits,
        mm.max_turns,
        mm.min_hits,
        mm.min_turns,
        mm.stat_chance
      FROM pokemon_v2_move m
      LEFT JOIN pokemon_v2_type t ON m.type_id = t.id
      LEFT JOIN pokemon_v2_movedamageclass dc ON m.move_damage_class_id = dc.id
      LEFT JOIN pokemon_v2_moveeffect me ON m.move_effect_id = me.id
      LEFT JOIN pokemon_v2_moveeffecteffecttext mee ON me.id = mee.move_effect_id AND mee.language_id = 9
      LEFT JOIN pokemon_v2_movetarget mt ON m.move_target_id = mt.id
      LEFT JOIN pokemon_v2_movemeta mm ON m.id = mm.move_id
      WHERE m.id = $1
    `;

    const result = await this.pokemonRepository.query(moveQuery, [id]);

    if (result.length === 0) {
      throw new Error(`Move with ID ${id} not found`);
    }

    const move = result[0];

    return {
      id: move.id,
      name: move.name,
      power: move.power,
      pp: move.pp,
      accuracy: move.accuracy,
      priority: move.priority,
      effectChance: move.move_effect_chance,
      type: move.type,
      damageClass: move.damage_class,
      effect: move.effect || 'Sin descripción',
      detailedEffect: move.detailed_effect,
      generationId: move.generation_id,
      target: move.target,
      meta: {
        ailmentChance: move.ailment_chance,
        critRate: move.crit_rate,
        drain: move.drain,
        flinchChance: move.flinch_chance,
        healing: move.healing,
        maxHits: move.max_hits,
        maxTurns: move.max_turns,
        minHits: move.min_hits,
        minTurns: move.min_turns,
        statChance: move.stat_chance,
      },
    };
  }

  /**
   * Obtener todos los tipos de movimientos disponibles
   */
  async getTypes() {
    const query = `
      SELECT DISTINCT t.id, t.name
      FROM pokemon_v2_type t
      INNER JOIN pokemon_v2_move m ON m.type_id = t.id
      ORDER BY t.name
    `;

    const types = await this.pokemonRepository.query(query);
    return types;
  }

  /**
   * Obtener todas las clases de daño
   */
  async getDamageClasses() {
    const query = `
      SELECT id, name
      FROM pokemon_v2_movedamageclass
      ORDER BY id
    `;

    const classes = await this.pokemonRepository.query(query);
    return classes;
  }
}
