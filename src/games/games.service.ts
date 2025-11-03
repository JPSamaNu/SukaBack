import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Version } from './entities/version.entity';
import { VersionGroup } from './entities/version-group.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Version)
    private versionRepository: Repository<Version>,
    @InjectRepository(VersionGroup)
    private versionGroupRepository: Repository<VersionGroup>,
  ) {}

  async getAllVersionGroups() {
    const query = `
      SELECT 
        vg.id,
        vg.name,
        vg.generation_id as "generationId",
        g.name as "generationName",
        COUNT(DISTINCT v.id) as "versionCount",
        json_agg(
          json_build_object(
            'id', v.id,
            'name', v.name
          ) ORDER BY v.id
        ) as versions
      FROM pokemon_v2_versiongroup vg
      LEFT JOIN pokemon_v2_version v ON v.version_group_id = vg.id
      LEFT JOIN pokemon_v2_generation g ON vg.generation_id = g.id
      GROUP BY vg.id, vg.name, vg.generation_id, g.name
      ORDER BY vg.id
    `;

    const result = await this.versionGroupRepository.query(query);
    return result;
  }

  async getVersionGroupById(id: number) {
    const query = `
      SELECT 
        vg.id,
        vg.name,
        vg.generation_id as "generationId",
        g.name as "generationName",
        json_agg(
          json_build_object(
            'id', v.id,
            'name', v.name
          ) ORDER BY v.id
        ) as versions
      FROM pokemon_v2_versiongroup vg
      LEFT JOIN pokemon_v2_version v ON v.version_group_id = vg.id
      LEFT JOIN pokemon_v2_generation g ON vg.generation_id = g.id
      WHERE vg.id = $1
      GROUP BY vg.id, vg.name, vg.generation_id, g.name
    `;

    const result = await this.versionGroupRepository.query(query, [id]);
    return result[0] || null;
  }

  async getPokedexByVersionGroup(versionGroupId: number) {
    const query = `
      SELECT DISTINCT
        p.id,
        p.name,
        pspecies.name as "speciesName",
        pspecies.order as "order",
        pdex.pokedex_number as "pokedexNumber",
        pdex_info.name as "pokedexName"
      FROM pokemon_v2_pokemondexnumber pdex
      INNER JOIN pokemon_v2_pokedex pdex_info ON pdex.pokedex_id = pdex_info.id
      INNER JOIN pokemon_v2_pokemonspecies pspecies ON pdex.pokemon_species_id = pspecies.id
      INNER JOIN pokemon_v2_pokemon p ON p.pokemon_species_id = pspecies.id
      INNER JOIN pokemon_v2_pokedexversiongroup pvg ON pdex.pokedex_id = pvg.pokedex_id
      WHERE pvg.version_group_id = $1
        AND p.is_default = true
      ORDER BY pdex.pokedex_number
    `;

    const result = await this.versionRepository.query(query, [versionGroupId]);
    return result;
  }

  async getAllVersions() {
    return await this.versionRepository.find({
      order: { id: 'ASC' },
    });
  }

  async getVersionById(id: number) {
    const query = `
      SELECT 
        v.id,
        v.name,
        v.version_group_id as "versionGroupId",
        vg.name as "versionGroupName",
        vg.generation_id as "generationId",
        g.name as "generationName"
      FROM pokemon_v2_version v
      LEFT JOIN pokemon_v2_versiongroup vg ON v.version_group_id = vg.id
      LEFT JOIN pokemon_v2_generation g ON vg.generation_id = g.id
      WHERE v.id = $1
    `;

    const result = await this.versionRepository.query(query, [id]);
    return result[0] || null;
  }
}
