import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Berry } from './entities/berry.entity';
import { BerryQueryDto } from './dto/berry.dto';

@Injectable()
export class BerriesService {
  constructor(
    @InjectRepository(Berry)
    private berryRepository: Repository<Berry>,
  ) {}

  /**
   * Obtener lista de berries con filtros y paginación
   */
  async findAll(query: BerryQueryDto) {
    const { search, firmness, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let queryBuilder = `
      SELECT 
        b.id,
        b.name,
        b.natural_gift_power,
        b.size,
        b.max_harvest,
        b.growth_time,
        b.soil_dryness,
        b.smoothness,
        bf.name as firmness,
        t.name as natural_gift_type,
        isp.sprites
      FROM pokemon_v2_berry b
      LEFT JOIN pokemon_v2_berryfirmness bf ON b.berry_firmness_id = bf.id
      LEFT JOIN pokemon_v2_type t ON b.natural_gift_type_id = t.id
      LEFT JOIN pokemon_v2_item i ON b.item_id = i.id
      LEFT JOIN pokemon_v2_itemsprites isp ON i.id = isp.item_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Filtro de búsqueda
    if (search) {
      queryBuilder += ` AND b.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro de firmeza
    if (firmness) {
      queryBuilder += ` AND bf.name = $${paramIndex}`;
      params.push(firmness);
      paramIndex++;
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM (${queryBuilder}) as count_query`;
    const countResult = await this.berryRepository.query(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Agregar ordenamiento y paginación
    queryBuilder += ` ORDER BY b.id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const berries = await this.berryRepository.query(queryBuilder, params);

    // Obtener sabores para cada berry
    const berriesWithFlavors = await Promise.all(
      berries.map(async (berry: any) => {
        const flavors = await this.berryRepository.query(
          `
          SELECT 
            bf.name as flavor,
            bfm.potency
          FROM pokemon_v2_berryflavormap bfm
          JOIN pokemon_v2_berryflavor bf ON bfm.berry_flavor_id = bf.id
          WHERE bfm.berry_id = $1 AND bfm.potency > 0
          ORDER BY bfm.potency DESC
          `,
          [berry.id]
        );

        // Extraer sprite del JSON
        let sprite = null;
        if (berry.sprites) {
          try {
            const spriteObj = typeof berry.sprites === 'string' 
              ? JSON.parse(berry.sprites) 
              : berry.sprites;
            sprite = spriteObj.default || null;
          } catch (e) {
            sprite = null;
          }
        }

        return {
          id: berry.id,
          name: berry.name,
          naturalGiftPower: berry.natural_gift_power,
          size: berry.size,
          maxHarvest: berry.max_harvest,
          growthTime: berry.growth_time,
          soilDryness: berry.soil_dryness,
          smoothness: berry.smoothness,
          firmness: berry.firmness,
          naturalGiftType: berry.natural_gift_type,
          flavors: flavors,
          sprite: sprite,
        };
      })
    );

    return {
      data: berriesWithFlavors,
      total,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener berry por ID
   */
  async findOne(id: number) {
    const berry = await this.berryRepository.query(
      `
      SELECT 
        b.id,
        b.name,
        b.natural_gift_power,
        b.size,
        b.max_harvest,
        b.growth_time,
        b.soil_dryness,
        b.smoothness,
        bf.name as firmness,
        t.name as natural_gift_type,
        isp.sprites
      FROM pokemon_v2_berry b
      LEFT JOIN pokemon_v2_berryfirmness bf ON b.berry_firmness_id = bf.id
      LEFT JOIN pokemon_v2_type t ON b.natural_gift_type_id = t.id
      LEFT JOIN pokemon_v2_item i ON b.item_id = i.id
      LEFT JOIN pokemon_v2_itemsprites isp ON i.id = isp.item_id
      WHERE b.id = $1
      `,
      [id]
    );

    if (berry.length === 0) {
      return null;
    }

    const flavors = await this.berryRepository.query(
      `
      SELECT 
        bf.name as flavor,
        bfm.potency
      FROM pokemon_v2_berryflavormap bfm
      JOIN pokemon_v2_berryflavor bf ON bfm.berry_flavor_id = bf.id
      WHERE bfm.berry_id = $1 AND bfm.potency > 0
      ORDER BY bfm.potency DESC
      `,
      [id]
    );

    // Extraer sprite
    let sprite = null;
    if (berry[0].sprites) {
      try {
        const spriteObj = typeof berry[0].sprites === 'string' 
          ? JSON.parse(berry[0].sprites) 
          : berry[0].sprites;
        sprite = spriteObj.default || null;
      } catch (e) {
        sprite = null;
      }
    }

    return {
      id: berry[0].id,
      name: berry[0].name,
      naturalGiftPower: berry[0].natural_gift_power,
      size: berry[0].size,
      maxHarvest: berry[0].max_harvest,
      growthTime: berry[0].growth_time,
      soilDryness: berry[0].soil_dryness,
      smoothness: berry[0].smoothness,
      firmness: berry[0].firmness,
      naturalGiftType: berry[0].natural_gift_type,
      flavors: flavors,
      sprite: sprite,
    };
  }

  /**
   * Obtener todas las firmezas disponibles
   */
  async getFirmnesses() {
    const result = await this.berryRepository.query(`
      SELECT id, name 
      FROM pokemon_v2_berryfirmness 
      ORDER BY id
    `);

    return result;
  }

  /**
   * Obtener todos los sabores disponibles
   */
  async getFlavors() {
    const result = await this.berryRepository.query(`
      SELECT id, name 
      FROM pokemon_v2_berryflavor 
      ORDER BY id
    `);

    return result;
  }
}
