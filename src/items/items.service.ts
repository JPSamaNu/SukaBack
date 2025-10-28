import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pokemon } from '../pokemon/entities/pokemon.entity';
import { ItemsQueryDto } from './dto/items.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
  ) {}

  /**
   * Obtener lista de items con filtros y paginación
   */
  async findAll(query: ItemsQueryDto) {
    const { page = 1, limit = 20, search, category } = query;
    const offset = (page - 1) * limit;

    // Construir query base
    let whereConditions = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Filtro por búsqueda (nombre del item)
    if (search) {
      whereConditions.push(`i.name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por categoría
    if (category) {
      whereConditions.push(`ic.name = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Query para obtener items
    const itemsQuery = `
      SELECT 
        i.id,
        i.name,
        i.cost,
        i.fling_power,
        ic.name as category,
        iet.effect,
        iet.short_effect,
        is2.sprites as sprite_data,
        ife.name as fling_effect
      FROM pokemon_v2_item i
      LEFT JOIN pokemon_v2_itemcategory ic ON i.item_category_id = ic.id
      LEFT JOIN pokemon_v2_itemeffecttext iet ON i.id = iet.item_id AND iet.language_id = 9
      LEFT JOIN pokemon_v2_itemsprites is2 ON i.id = is2.item_id
      LEFT JOIN pokemon_v2_itemflingeffect ife ON i.item_fling_effect_id = ife.id
      ${whereClause}
      ORDER BY i.id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pokemon_v2_item i
      LEFT JOIN pokemon_v2_itemcategory ic ON i.item_category_id = ic.id
      ${whereClause}
    `;

    const countParams = params.slice(0, -2); // Remover limit y offset

    const [items, countResult] = await Promise.all([
      this.pokemonRepository.query(itemsQuery, params),
      this.pokemonRepository.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: items.map((item: any) => {
        // Extraer sprite del JSON
        let sprite = null;
        if (item.sprite_data) {
          try {
            const spriteObj = typeof item.sprite_data === 'string' 
              ? JSON.parse(item.sprite_data) 
              : item.sprite_data;
            sprite = spriteObj.default || null;
          } catch (e) {
            sprite = null;
          }
        }

        return {
          id: item.id,
          name: item.name,
          cost: item.cost,
          category: item.category,
          effect: item.short_effect || item.effect || 'Sin descripción',
          sprite: sprite,
          flingPower: item.fling_power,
          flingEffect: item.fling_effect,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Obtener detalles de un item por ID
   */
  async findOne(id: number) {
    const itemQuery = `
      SELECT 
        i.id,
        i.name,
        i.cost,
        i.fling_power,
        ic.name as category,
        iet.effect,
        iet.short_effect,
        is2.sprites as sprite_data,
        ife.name as fling_effect,
        ife.id as fling_effect_id,
        ift.flavor_text
      FROM pokemon_v2_item i
      LEFT JOIN pokemon_v2_itemcategory ic ON i.item_category_id = ic.id
      LEFT JOIN pokemon_v2_itemeffecttext iet ON i.id = iet.item_id AND iet.language_id = 9
      LEFT JOIN pokemon_v2_itemsprites is2 ON i.id = is2.item_id
      LEFT JOIN pokemon_v2_itemflingeffect ife ON i.item_fling_effect_id = ife.id
      LEFT JOIN pokemon_v2_itemflavortext ift ON i.id = ift.item_id AND ift.language_id = 9
      WHERE i.id = $1
      LIMIT 1
    `;

    const result = await this.pokemonRepository.query(itemQuery, [id]);

    if (result.length === 0) {
      throw new Error(`Item with ID ${id} not found`);
    }

    const item = result[0];

    // Extraer sprite del JSON
    let sprite = null;
    if (item.sprite_data) {
      try {
        const spriteObj = typeof item.sprite_data === 'string' 
          ? JSON.parse(item.sprite_data) 
          : item.sprite_data;
        sprite = spriteObj.default || null;
      } catch (e) {
        sprite = null;
      }
    }

    return {
      id: item.id,
      name: item.name,
      cost: item.cost,
      category: item.category,
      effect: item.effect,
      shortEffect: item.short_effect,
      sprite: sprite,
      flingPower: item.fling_power,
      flingEffect: item.fling_effect,
      flavorText: item.flavor_text,
    };
  }

  /**
   * Obtener todas las categorías de items disponibles
   */
  async getCategories() {
    const query = `
      SELECT DISTINCT ic.id, ic.name
      FROM pokemon_v2_itemcategory ic
      INNER JOIN pokemon_v2_item i ON i.item_category_id = ic.id
      ORDER BY ic.name
    `;

    const categories = await this.pokemonRepository.query(query);
    return categories;
  }
}
