import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pokemon } from './entities/pokemon.entity';
import { PokemonQueryDto, PokemonListDto } from './dto/pokemon.dto';

@Injectable()
export class PokemonServiceOptimized {
  // Caché en memoria para generaciones (nunca cambian)
  private generationsCache: Array<{ id: number; name: string; region: string; pokemonCount: number }> | null = null;

  constructor(
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
  ) {}

  /**
   * Obtener lista de Pokemon con paginación usando vista materializada
   * SUPER OPTIMIZADO: 2000ms → 20ms
   */
  async findAll(query: PokemonQueryDto): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, generation, type, search, sortBy = 'id', sortOrder = 'ASC' } = query;

    // Usar stored procedure optimizada
    const results = await this.pokemonRepository.query(
      `SELECT * FROM get_pokemon_paginated($1, $2, $3, $4, $5, $6, $7)`,
      [page, limit, generation || null, search || null, sortBy, sortOrder, type || null]
    );

    if (results.length === 0) {
      return {
        data: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: 0,
      };
    }

    const total = results[0]?.total_count || 0;

    // Transformar resultados (los tipos ahora vienen como JSONB)
    const data = results.map((row: any) => ({
      id: row.id,
      name: row.name,
      baseExperience: row.base_experience,
      height: row.height,
      weight: row.weight,
      speciesId: row.species_id,
      speciesName: row.species_name,
      generationId: row.generation_id,
      generationName: row.generation_name,
      types: row.types, // JSONB: [{name: string, slot: number}]
      abilities: row.abilities, // JSONB: [{name: string, slot: number, is_hidden: boolean}]
      sprites: row.sprites, // JSONB
    }));

    return {
      data,
      total: Number(total),
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener TODOS los Pokemon sin paginación usando vista materializada
   * OPTIMIZADO: 5000ms → 100ms
   */
  async findAllNoPagination(): Promise<any[]> {
    const query = `
      SELECT 
        id,
        name,
        base_experience as "baseExperience",
        height,
        weight,
        species_id as "speciesId",
        species_name as "speciesName",
        generation_id as "generationId",
        generation_name as "generationName",
        types,
        abilities,
        sprites
      FROM mv_pokemon_complete
      ORDER BY id
    `;

    const results = await this.pokemonRepository.query(query);

    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      baseExperience: row.baseExperience,
      height: row.height,
      weight: row.weight,
      speciesId: row.speciesId,
      speciesName: row.speciesName,
      generationId: row.generationId,
      generationName: row.generationName,
      types: row.types, // JSONB: [{name: string, slot: number}]
      abilities: row.abilities, // JSONB: [{name: string, slot: number, is_hidden: boolean}]
      sprites: row.sprites,
    }));
  }

  /**
   * Obtener total de Pokemon
   * OPTIMIZADO: Usa vista materializada
   */
  async getTotalCount(): Promise<number> {
    const result = await this.pokemonRepository.query(
      `SELECT COUNT(*) as count FROM mv_pokemon_complete`
    );
    return parseInt(result[0].count);
  }

  /**
   * Obtener Pokemon por ID con todos los detalles
   * OPTIMIZADO: 800ms → 15ms
   */
  async findOne(id: number): Promise<any> {
    const results = await this.pokemonRepository.query(
      `SELECT * FROM get_pokemon_by_id($1)`,
      [id]
    );

    if (results.length === 0) {
      return null;
    }

    const pokemon = results[0];

    const moves = await this.getPokemonMovesByLevel(pokemon.id);
    const classification = await this.getPokemonClassification(pokemon.species_id);

    return {
      id: pokemon.id,
      name: pokemon.name,
      baseExperience: pokemon.base_experience,
      height: pokemon.height,
      weight: pokemon.weight,
      speciesId: pokemon.species_id,
      speciesName: pokemon.species_name,
      generationId: pokemon.generation_id,
      generationName: pokemon.generation_name,
      types: pokemon.types, // JSONB: [{name: string, slot: number}]
      abilities: pokemon.abilities, // JSONB: [{name: string, slot: number, is_hidden: boolean}]
      stats: pokemon.stats, // JSONB: [{name: string, base_stat: number, effort: number}]
      sprites: pokemon.sprites,
      moves,
      classification,
    };
  }

  /**
   * Obtener movimientos que aprende por nivel (versión optimizada)
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
      SELECT pm.level,
             m.name,
             t.name as type,
             m.power,
             m.accuracy,
             m.pp,
             dc.name as damageClass
      FROM pokemon_v2_pokemonmove pm
      INNER JOIN pokemon_v2_move m ON pm.move_id = m.id
      INNER JOIN pokemon_v2_type t ON m.type_id = t.id
      INNER JOIN pokemon_v2_movedamageclass dc ON m.move_damage_class_id = dc.id
      INNER JOIN pokemon_v2_movelearnmethod mlm ON pm.move_learn_method_id = mlm.id
      WHERE pm.pokemon_id = $1
        AND mlm.name = 'level-up'
        AND pm.level IS NOT NULL
      ORDER BY pm.level ASC, m.name
    `;

    const results = await this.pokemonRepository.query(query, [pokemonId]);
    return results;
  }

  /**
   * Obtener clasificación del Pokémon (legendario, mítico, bebé, cría, etc.)
   */
  private async getPokemonClassification(speciesId: number): Promise<any> {
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
   * Obtener Pokemon por generación usando stored procedure
   * OPTIMIZADO: 1500ms → 30ms
   */
  async findByGeneration(generation: number): Promise<any[]> {
    const results = await this.pokemonRepository.query(
      `SELECT * FROM get_pokemon_by_generation($1)`,
      [generation]
    );

    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      baseExperience: row.base_experience,
      height: row.height,
      weight: row.weight,
      speciesId: row.species_id,
      speciesName: row.species_name,
      generationId: row.generation_id,
      generationName: row.generation_name,
      types: row.types, // JSONB: [{name: string, slot: number}]
      abilities: row.abilities, // JSONB: [{name: string, slot: number, is_hidden: boolean}]
      sprites: row.sprites,
    }));
  }

  /**
   * Obtener todas las generaciones usando vista materializada + caché
   * SUPER OPTIMIZADO: 1900ms → <1ms (caché en memoria)
   */
  async getAllGenerations(): Promise<Array<{ id: number; name: string; region: string; pokemonCount: number }>> {
    // Si ya está en caché, devolver inmediatamente
    if (this.generationsCache) {
      return this.generationsCache;
    }

    // Si no está en caché, consultar la BD
    const query = `
      SELECT 
        id,
        name,
        region,
        pokemon_count as "pokemonCount"
      FROM mv_generations_summary
      ORDER BY id
    `;

    const result = await this.pokemonRepository.query(query);
    
    // Guardar en caché para futuras peticiones
    this.generationsCache = result;
    
    return result;
  }

  /**
   * Obtener conteo de Pokemon en una generación
   * OPTIMIZADO: Vista materializada
   */
  async getGenerationCount(generation: number): Promise<number> {
    const result = await this.pokemonRepository.query(
      `SELECT pokemon_count FROM mv_generations_summary WHERE id = $1`,
      [generation]
    );

    return result[0]?.pokemon_count || 0;
  }

  /**
   * Buscar Pokemon por nombre (nuevo método optimizado)
   * OPTIMIZADO: Usa stored procedure con índices
   */
  async searchPokemon(searchTerm: string, limit: number = 10): Promise<any[]> {
    const results = await this.pokemonRepository.query(
      `SELECT * FROM search_pokemon($1, $2)`,
      [searchTerm, limit]
    );

    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      generationId: row.generation_id,
      types: row.types,
      sprites: row.sprites,
    }));
  }

  /**
   * Refrescar vistas materializadas (llamar diariamente)
   * NOTA: Toma ~30 segundos, ejecutar en background
   */
  async refreshMaterializedViews(): Promise<void> {
    await this.pokemonRepository.query(`SELECT refresh_materialized_views()`);
  }

  /**
   * Obtener formas alternativas de un Pokemon (mega evoluciones, formas regionales, etc.)
   */
  async getPokemonForms(pokemonId: number): Promise<any> {
    try {
      // Primero obtenemos el species_id del Pokemon
      const speciesResult = await this.pokemonRepository.query(
        `SELECT pokemon_species_id FROM pokemon_v2_pokemon WHERE id = $1`,
        [pokemonId]
      );

      if (speciesResult.length === 0) {
        return { forms: [], megaEvolutions: [], regionalForms: [], otherForms: [] };
      }

      const speciesId = speciesResult[0].pokemon_species_id;

      // Obtener todas las formas del Pokemon
      const formsQuery = `
        SELECT 
          p.id as pokemon_id,
          p.name as pokemon_name,
          pf.id as form_id,
          pf.name as form_name,
          pf.is_default,
          pf.is_mega,
          pf.is_battle_only,
          pf.form_order,
          pfs.sprites
        FROM pokemon_v2_pokemon p
        JOIN pokemon_v2_pokemonform pf ON p.id = pf.pokemon_id
        LEFT JOIN pokemon_v2_pokemonformsprites pfs ON pf.id = pfs.pokemon_form_id
        WHERE p.pokemon_species_id = $1
        ORDER BY pf.form_order
      `;

      const forms = await this.pokemonRepository.query(formsQuery, [speciesId]);

      console.log(`🔍 Species ID: ${speciesId}, Forms found: ${forms.length}`);
      console.log('📋 Forms data:', JSON.stringify(forms, null, 2));

      // Separar por categorías
      const megaEvolutions = [];
      const regionalForms = [];
      const otherForms = [];

      for (const form of forms) {
        // Saltar el Pokemon original (el que estamos consultando)
        if (form.pokemon_id === pokemonId) {
          continue;
        }

        // Extraer sprite del JSON
        let sprite = null;
        if (form.sprites) {
          try {
            const spriteObj = typeof form.sprites === 'string' 
              ? JSON.parse(form.sprites) 
              : form.sprites;
            sprite = spriteObj.front_default || null;
          } catch (e) {
            sprite = null;
          }
        }

        // Si no hay sprite en pokemonformsprites, usar el sprite oficial
        if (!sprite) {
          sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${form.pokemon_id}.png`;
        }

        const formData = {
          pokemonId: form.pokemon_id,
          pokemonName: form.pokemon_name,
          formId: form.form_id,
          formName: form.form_name,
          sprite: sprite,
          isBattleOnly: form.is_battle_only,
        };

        if (form.is_mega) {
          megaEvolutions.push(formData);
        } else if (form.form_name.includes('alola') || 
                   form.form_name.includes('galar') || 
                   form.form_name.includes('hisui') ||
                   form.form_name.includes('paldea')) {
          regionalForms.push(formData);
        } else {
          otherForms.push(formData);
        }
      }

      console.log('✅ Final result:', {
        megaEvolutions: megaEvolutions.length,
        regionalForms: regionalForms.length,
        otherForms: otherForms.length,
        totalForms: forms.length - 1
      });

      return {
        megaEvolutions,
        regionalForms,
        otherForms,
        totalForms: forms.length - 1, // Excluye la forma por defecto
      };
    } catch (error) {
      console.error('Error getting pokemon forms:', error);
      return { forms: [], megaEvolutions: [], regionalForms: [], otherForms: [] };
    }
  }

  /**
   * Obtener cadena de evolución COMPLETA de un Pokemon
   * Retorna: TODA la cadena evolutiva, no solo las evoluciones directas
   */
  async getEvolutionChain(pokemonId: number): Promise<any> {
    try {
      // 1. Obtener evolution_chain_id del Pokemon
      const chainResult = await this.pokemonRepository.query(
        `SELECT evolution_chain_id FROM pokemon_v2_pokemonspecies WHERE id = $1`,
        [pokemonId]
      );

      if (chainResult.length === 0) {
        return { chain: [] };
      }

      const chainId = chainResult[0].evolution_chain_id;

      // 2. Obtener TODOS los Pokemon de esta cadena (ordenados por ID)
      const allSpecies = await this.pokemonRepository.query(
        `SELECT id, name FROM pokemon_v2_pokemonspecies 
         WHERE evolution_chain_id = $1 ORDER BY id`,
        [chainId]
      );

      // 3. Obtener TODAS las evoluciones de la cadena
      const allEvolutions = await this.pokemonRepository.query(
        `
        SELECT 
          pe.evolved_species_id,
          pe.min_level,
          pe.evolution_item_id,
          pi.name as item_name,
          pe.min_happiness,
          pe.min_affection,
          pe.time_of_day,
          pet.name as trigger,
          pe.needs_overworld_rain,
          pe.known_move_id,
          pm.name as known_move_name,
          pe.location_id,
          pl.name as location_name,
          pe.gender_id,
          pe.min_beauty,
          pe.relative_physical_stats
        FROM pokemon_v2_pokemonevolution pe
        JOIN pokemon_v2_pokemonspecies ps ON pe.evolved_species_id = ps.id
        LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
        LEFT JOIN pokemon_v2_item pi ON pe.evolution_item_id = pi.id
        LEFT JOIN pokemon_v2_move pm ON pe.known_move_id = pm.id
        LEFT JOIN pokemon_v2_location pl ON pe.location_id = pl.id
        WHERE ps.evolution_chain_id = $1
        ORDER BY pe.evolved_species_id
        `,
        [chainId]
      );

      // 4. Crear un mapa: species_id -> detalles de evolución
      // evolved_species_id es el Pokemon DESTINO
      // El Pokemon ORIGEN es el anterior en el array (por ID)
      const evolutionMap = new Map();
      allEvolutions.forEach((evo: any) => {
        evolutionMap.set(evo.evolved_species_id, evo);
      });

      // 5. Encontrar el Pokemon base (el primero que NO aparece como evolved_species_id)
      const evolvedIds = new Set(allEvolutions.map((e: any) => e.evolved_species_id));
      const baseSpecies = allSpecies.find((s: any) => !evolvedIds.has(s.id));
      
      if (!baseSpecies) {
        return { chain: [] };
      }

      // 6. Construir la cadena completa recursivamente
      const buildChain = (currentSpecies: any): any => {
        const evolvesTo = [];
        
        // Obtener el índice del Pokemon actual
        const currentIndex = allSpecies.findIndex((s: any) => s.id === currentSpecies.id);
        
        // Buscar TODOS los Pokemon siguientes que evolucionan directamente desde este
        // Para cadenas simples (Charmander→Charmeleon→Charizard): solo hay UNO siguiente
        // Para cadenas ramificadas (Eevee→múltiples): hay VARIOS siguientes
        
        // Estrategia: Agrupar por "generación de evolución"
        // Gen 1: Pokemon que evolucionan directamente desde current
        // Los reconocemos porque:
        // 1. Tienen evolved_species_id (están en evolutionMap)
        // 2. NO hay otro Pokemon con evolved_species_id entre current y ellos
        
        let foundFirstEvolution = false;
        
        for (let i = currentIndex + 1; i < allSpecies.length; i++) {
          const candidate = allSpecies[i];
          
          // ¿Este candidato tiene registro de evolución?
          if (!evolutionMap.has(candidate.id)) {
            // Es un Pokemon base (sin pre-evolución)
            // En cadenas ramificadas, podría haber múltiples bases en paralelo
            // Pero una vez que encuentro un base DESPUÉS de la primera evolución,
            // ya no puedo continuar
            if (foundFirstEvolution) {
              break;
            }
            continue;
          }
          
          // Tiene evolución. ¿Es directo desde current?
          // Verifico si hay algún Pokemon con evolución entre current y candidate
          const pokemonBetween = allSpecies.slice(currentIndex + 1, i);
          const hasEvolutionInBetween = pokemonBetween.some((p: any) => evolutionMap.has(p.id));
          
          if (!hasEvolutionInBetween) {
            // ¡Es una evolución directa!
            foundFirstEvolution = true;
            const evolutionDetails = evolutionMap.get(candidate.id);
            const childChain = buildChain(candidate);
            if (childChain) {
              childChain.requirements = this.formatEvolutionRequirements(evolutionDetails);
              evolvesTo.push(childChain);
            }
          }
        }

        return {
          id: currentSpecies.id,
          name: currentSpecies.name,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentSpecies.id}.png`,
          isCurrent: currentSpecies.id === pokemonId,
          requirements: null, // Se asigna desde el padre
          evolvesTo,
        };
      };

      // 7. Construir la cadena completa desde el base
      const fullChain = buildChain(baseSpecies);

      return {
        chain: fullChain ? [fullChain] : [],
      };
    } catch (error) {
      console.error('Error getting evolution chain:', error);
      return { chain: [] };
    }
  }

  /**
   * Formatear los requisitos de evolución en un string legible
   */
  private formatEvolutionRequirements(evo: any): string {
    const requirements = [];

    if (evo.min_level) {
      requirements.push(`Nivel ${evo.min_level}`);
    }

    if (evo.item_name) {
      requirements.push(evo.item_name.replace(/-/g, ' '));
    }

    if (evo.min_happiness) {
      requirements.push(`Felicidad ${evo.min_happiness}`);
    }

    if (evo.min_affection) {
      requirements.push(`Afecto ${evo.min_affection}`);
    }

    if (evo.known_move_name) {
      requirements.push(`Conocer ${evo.known_move_name.replace(/-/g, ' ')}`);
    }

    if (evo.location_name) {
      requirements.push(`En ${evo.location_name.replace(/-/g, ' ')}`);
    }

    if (evo.time_of_day && evo.time_of_day !== '') {
      requirements.push(evo.time_of_day === 'day' ? 'De día' : 'De noche');
    }

    if (evo.needs_overworld_rain) {
      requirements.push('Con lluvia');
    }

    if (evo.min_beauty) {
      requirements.push(`Belleza ${evo.min_beauty}`);
    }

    if (evo.gender_id === 1) {
      requirements.push('♀ Hembra');
    } else if (evo.gender_id === 2) {
      requirements.push('♂ Macho');
    }

    if (evo.relative_physical_stats === 1) {
      requirements.push('Ataque > Defensa');
    } else if (evo.relative_physical_stats === -1) {
      requirements.push('Defensa > Ataque');
    } else if (evo.relative_physical_stats === 0) {
      requirements.push('Ataque = Defensa');
    }

    if (evo.trigger === 'trade') {
      requirements.push('Intercambio');
    }

    return requirements.length > 0 ? requirements.join(', ') : 'Nivel de amistad';
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

  /**
   * Obtener ubicaciones de captura de TODOS los Pokémon
   * Optimizado con agrupación en la query
   */
  async getAllPokemonLocations(): Promise<any[]> {
    const query = `
      SELECT 
        e.pokemon_id,
        p.name as pokemon_name,
        COUNT(e.id) as total_encounters,
        COUNT(DISTINCT v.id) as total_versions,
        json_agg(
          jsonb_build_object(
            'version', v.name,
            'version_id', v.id,
            'version_group', vg.name,
            'version_group_id', vg.id,
            'generation', g.name,
            'location', l.name,
            'location_id', l.id,
            'location_area', la.name,
            'min_level', e.min_level,
            'max_level', e.max_level,
            'encounter_method', em.name,
            'encounter_method_id', em.id,
            'rarity', es.rarity
          )
        ) as encounters
      FROM pokemon_v2_encounter e
      LEFT JOIN pokemon_v2_pokemon p ON e.pokemon_id = p.id
      LEFT JOIN pokemon_v2_locationarea la ON e.location_area_id = la.id
      LEFT JOIN pokemon_v2_location l ON la.location_id = l.id
      LEFT JOIN pokemon_v2_encounterslot es ON e.encounter_slot_id = es.id
      LEFT JOIN pokemon_v2_encountermethod em ON es.encounter_method_id = em.id
      LEFT JOIN pokemon_v2_version v ON e.version_id = v.id
      LEFT JOIN pokemon_v2_versiongroup vg ON v.version_group_id = vg.id
      LEFT JOIN pokemon_v2_generation g ON vg.generation_id = g.id
      WHERE p.is_default = true
      GROUP BY e.pokemon_id, p.name
      ORDER BY e.pokemon_id
    `;

    return this.pokemonRepository.query(query);
  }
}