/**
 * PokéAPI v2 Complete Seeder - Integral y Completo
 * 
 * Características:
 * - Todas las generaciones (1-9+)
 * - Todos los Pokemon
 * - Versiones, version groups, tipos, moves completos
 * - Items, encounters, flavor texts (es/en)
 * - Idempotente (upserts)
 * - Rate limiting y reintentos
 * - Paginación automática
 * - Manejo robusto de errores
 * 
 * Uso:
 *   node seeders/pokeapi-complete.js [--full] [--gen=N]
 * 
 * Opciones:
 *   --full    : Poblar TODOS los Pokemon (1010+)
 *   --gen=N   : Poblar solo generación N (1-9)
 *   Sin args  : Poblar gen 1-3 (primeras 386 Pokemon)
 */

const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

const API = (path) => `https://pokeapi.co/api/v2/${path}`;
const idFromUrl = (url) => Number(url.split('/').filter(Boolean).pop());

/** Configuración */
const CONFIG = {
  RATE_DELAY_MS: 100,        // Delay entre requests (100ms = 10 req/seg)
  RETRIES: 5,                 // Reintentos por request fallido
  BATCH_SIZE: 50,            // Tamaño de lote para operaciones batch
  MAX_CONCURRENT: 5,         // Requests concurrentes máximos
  GENERATION_RANGES: {
    1: { start: 1, end: 151, name: 'Kanto' },
    2: { start: 152, end: 251, name: 'Johto' },
    3: { start: 252, end: 386, name: 'Hoenn' },
    4: { start: 387, end: 493, name: 'Sinnoh' },
    5: { start: 494, end: 649, name: 'Unova' },
    6: { start: 650, end: 721, name: 'Kalos' },
    7: { start: 722, end: 809, name: 'Alola' },
    8: { start: 810, end: 905, name: 'Galar' },
    9: { start: 906, end: 1025, name: 'Paldea' }
  }
};

class PokeAPICompleteSeeder {
  constructor() {
    this.db = new PostgresDatabase();
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    this.versionGroupCache = null; // Cache de version_groups
  }

  /** === UTILIDADES === */
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logProgress(message, data = {}) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`[${elapsed}s] ${message}`, data.count ? `(${data.count})` : '');
  }

  /** Cargar cache de version_groups para evitar queries repetitivas */
  async loadVersionGroupCache() {
    if (this.versionGroupCache) return;
    
    const versionGroups = await this.db.all('SELECT id FROM version_group');
    this.versionGroupCache = new Set(versionGroups.map(vg => vg.id));
    console.log(`📦 Cache cargado: ${this.versionGroupCache.size} version_groups`);
  }

  /** Verificar si un version_group existe (usando cache) */
  versionGroupExists(id) {
    return this.versionGroupCache.has(id);
  }

  /** Fetch con reintentos, rate limiting y backoff exponencial */
  async safeFetch(url, retries = CONFIG.RETRIES) {
    for (let i = 0; i <= retries; i++) {
      try {
        this.requestCount++;
        
        const response = await fetch(url, { 
          headers: { 
            'User-Agent': 'SukaDex-Complete-Seeder/2.0',
            'Accept': 'application/json'
          } 
        });
        
        if (response.ok) {
          await this.sleep(CONFIG.RATE_DELAY_MS);
          return await response.json();
        }
        
        if (response.status === 429) {
          const wait = 2000 * Math.pow(2, i);
          console.warn(`⚠️  Rate limited. Waiting ${wait}ms...`);
          await this.sleep(wait);
          continue;
        }
        
        if (response.status === 404) {
          return null; // Resource no existe
        }
        
        throw new Error(`HTTP ${response.status}`);
        
      } catch (err) {
        this.errorCount++;
        
        if (i === retries) {
          console.error(`❌ Failed after ${retries} retries: ${url}`);
          throw err;
        }
        
        const wait = 500 * Math.pow(2, i);
        await this.sleep(wait);
      }
    }
  }

  /** Fetch paginado automático */
  async fetchPaginated(endpoint, limit = 100) {
    const results = [];
    let url = API(`${endpoint}?limit=${limit}`);
    
    while (url) {
      const data = await this.safeFetch(url);
      if (!data) break;
      
      results.push(...data.results);
      url = data.next;
      
      if (url) {
        this.logProgress(`Fetching ${endpoint}`, { count: results.length });
      }
    }
    
    return results;
  }

  /** Upsert genérico para PostgreSQL */
  async upsert(table, data, conflictColumns = ['id'], updateColumns = null) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
    
    const toUpdate = updateColumns || columns.filter(col => !conflictColumns.includes(col));
    const updateSet = toUpdate.length > 0
      ? toUpdate.map(col => `${col} = EXCLUDED.${col}`).join(', ')
      : 'id = EXCLUDED.id';
    
    const sql = `
      INSERT INTO ${table} (${columns.join(',')}) 
      VALUES (${placeholders})
      ON CONFLICT (${conflictColumns.join(',')}) 
      DO UPDATE SET ${updateSet}
      RETURNING id
    `;
    
    try {
      const result = await this.db.query(sql, values);
      return result.rows[0]?.id;
    } catch (error) {
      console.error(`Error upserting ${table}:`, error.message);
      throw error;
    }
  }

  /** === FASE 1: GENERACIONES === */
  
  async seedGenerations() {
    this.logProgress('🌱 Seeding generations...');
    
    const generations = await this.fetchPaginated('generation', 20);
    
    for (const gen of generations) {
      const data = await this.safeFetch(gen.url);
      if (!data) continue;
      
      await this.upsert('generation', {
        id: data.id,
        name: data.name
      });
    }
    
    const count = await this.db.get('SELECT COUNT(*) as count FROM generation');
    this.logProgress('✅ Generations seeded', count);
  }

  /** === FASE 2: VERSION GROUPS Y VERSIONES === */
  
  async seedVersionGroups() {
    this.logProgress('🌱 Seeding version groups...');
    
    const versionGroups = await this.fetchPaginated('version-group', 100);
    
    for (const vg of versionGroups) {
      const data = await this.safeFetch(vg.url);
      if (!data) continue;
      
      // Extraer generation_id
      const genId = data.generation ? idFromUrl(data.generation.url) : null;
      
      await this.upsert('version_group', {
        id: data.id,
        name: data.name,
        generation_id: genId
      });
      
      // Versiones del grupo
      for (const version of data.versions || []) {
        const vId = idFromUrl(version.url);
        await this.upsert('version', {
          id: vId,
          name: version.name,
          version_group_id: data.id
        });
      }
    }
    
    const stats = await Promise.all([
      this.db.get('SELECT COUNT(*) as count FROM version_group'),
      this.db.get('SELECT COUNT(*) as count FROM version')
    ]);
    
    this.logProgress('✅ Version groups seeded', stats[0]);
    this.logProgress('✅ Versions seeded', stats[1]);
  }

  /** === FASE 3: TIPOS === */
  
  async seedTypes() {
    this.logProgress('🌱 Seeding types...');
    
    const types = await this.fetchPaginated('type', 50);
    
    for (const type of types) {
      const data = await this.safeFetch(type.url);
      if (!data) continue;
      
      await this.upsert('type', {
        id: data.id,
        name: data.name
      });
    }
    
    const count = await this.db.get('SELECT COUNT(*) as count FROM type');
    this.logProgress('✅ Types seeded', count);
  }

  /** === FASE 4: MOVES (COMPLETOS) === */
  
  async seedMoves() {
    this.logProgress('🌱 Seeding moves (all details)...');
    
    const moves = await this.fetchPaginated('move', 100);
    let processed = 0;
    
    for (const move of moves) {
      const data = await this.safeFetch(move.url);
      if (!data) continue;
      
      const typeId = data.type ? idFromUrl(data.type.url) : null;
      
      await this.upsert('move', {
        id: data.id,
        name: data.name,
        accuracy: data.accuracy,
        power: data.power,
        pp: data.pp,
        type_id: typeId
      });
      
      processed++;
      if (processed % 100 === 0) {
        this.logProgress(`Processing moves`, { count: processed });
      }
    }
    
    const count = await this.db.get('SELECT COUNT(*) as count FROM move');
    this.logProgress('✅ Moves seeded', count);
  }

  /** === FASE 5: ITEMS (BÁSICO) === */
  
  async seedItems() {
    this.logProgress('🌱 Seeding items...');
    
    const items = await this.fetchPaginated('item', 100);
    let processed = 0;
    
    for (const item of items) {
      const data = await this.safeFetch(item.url);
      if (!data) continue;
      
      await this.upsert('item', {
        id: data.id,
        name: data.name
      });
      
      processed++;
      if (processed % 100 === 0) {
        this.logProgress(`Processing items`, { count: processed });
      }
    }
    
    const count = await this.db.get('SELECT COUNT(*) as count FROM item');
    this.logProgress('✅ Items seeded', count);
  }

  /** === FASE 6: POKEMON (COMPLETO) === */
  
  async seedPokemonRange(startId, endId) {
    this.logProgress(`🌱 Seeding Pokemon ${startId} to ${endId}...`);
    
    // Cargar cache de version_groups una sola vez
    await this.loadVersionGroupCache();
    
    let successCount = 0;
    let skippedCount = 0;
    let alreadyLoadedCount = 0;
    
    for (let id = startId; id <= endId; id++) {
      try {
        // Verificar si el Pokemon ya está cargado
        const existingPokemon = await this.db.get(
          'SELECT id FROM pokemon WHERE id = $1',
          [id]
        );
        
        if (existingPokemon) {
          alreadyLoadedCount++;
          // Solo mostrar cada 10 Pokemon ya cargados para no saturar la consola
          if (alreadyLoadedCount % 10 === 1 || alreadyLoadedCount < 5) {
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
            console.log(`[${elapsed}s] ⏭️  #${id.toString().padStart(3, '0')} ya cargado, saltando...`);
          }
          continue;
        }
        
        const pokemon = await this.safeFetch(API(`pokemon/${id}`));
        if (!pokemon) {
          console.warn(`⚠️  Pokemon #${id} not found, skipping`);
          skippedCount++;
          continue;
        }
        
        // Pokemon principal
        await this.upsert('pokemon', {
          id: pokemon.id,
          name: pokemon.name,
          height: pokemon.height,
          weight: pokemon.weight,
          base_experience: pokemon.base_experience,
          sprite_url: pokemon.sprites?.front_default || null
        });
        
        // Tipos
        const types = [];
        for (const typeInfo of pokemon.types || []) {
          const typeId = idFromUrl(typeInfo.type.url);
          types.push(typeInfo.type.name);
          await this.db.query(`
            INSERT INTO pokemon_type (pokemon_id, type_id, slot)
            VALUES ($1, $2, $3)
            ON CONFLICT (pokemon_id, type_id, slot) DO NOTHING
          `, [pokemon.id, typeId, typeInfo.slot]);
        }
        
        // Movimientos (con verificación de version_group usando cache)
        let moveCount = 0;
        for (const moveInfo of pokemon.moves || []) {
          const moveId = idFromUrl(moveInfo.move.url);
          
          // Asegurar que el move existe
          await this.db.query(`
            INSERT INTO move (id, name) VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING
          `, [moveId, moveInfo.move.name]);
          
          for (const versionDetail of moveInfo.version_group_details || []) {
            const vgId = idFromUrl(versionDetail.version_group.url);
            
            // Verificar que version_group existe (usando cache - MUY RÁPIDO)
            if (this.versionGroupExists(vgId)) {
              await this.db.query(`
                INSERT INTO pokemon_move (pokemon_id, move_id, version_group_id, learn_method, level)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (pokemon_id, move_id, version_group_id, learn_method) DO NOTHING
              `, [
                pokemon.id,
                moveId,
                vgId,
                versionDetail.move_learn_method?.name || 'unknown',
                versionDetail.level_learned_at || null
              ]);
              moveCount++;
            }
          }
        }
        
        // Held items
        let itemCount = 0;
        for (const heldItem of pokemon.held_items || []) {
          const itemId = idFromUrl(heldItem.item.url);
          
          // Asegurar que el item existe
          await this.db.query(`
            INSERT INTO item (id, name) VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING
          `, [itemId, heldItem.item.name]);
          
          for (const versionDetail of heldItem.version_details || []) {
            const versionId = idFromUrl(versionDetail.version.url);
            
            await this.db.query(`
              INSERT INTO pokemon_held_item (pokemon_id, item_id, version_id, rarity)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (pokemon_id, item_id, version_id) DO UPDATE SET rarity = EXCLUDED.rarity
            `, [pokemon.id, itemId, versionId, versionDetail.rarity || 0]);
            itemCount++;
          }
        }
        
        successCount++;
        
        // Imprimir cada Pokemon con sus detalles
        const typesStr = types.join('/');
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        console.log(`[${elapsed}s] ✅ #${id.toString().padStart(3, '0')} ${pokemon.name.padEnd(15)} | ${typesStr.padEnd(18)} | ${moveCount.toString().padStart(3)} moves | ${itemCount.toString().padStart(2)} items`);
        
      } catch (error) {
        console.error(`\n❌ ERROR processing Pokemon #${id} (${error.message})`);
        console.error('Stack trace:', error.stack);
        console.error('Error completo:', JSON.stringify(error, null, 2));
        throw error; // Propagate error para que el handler global lo capture
      }
    }
    
    console.log(`\n📊 Resumen: ${successCount} Pokemon cargados exitosamente${skippedCount > 0 ? `, ${skippedCount} omitidos` : ''}${alreadyLoadedCount > 0 ? `, ${alreadyLoadedCount} ya existían` : ''}\n`);
  }

  /** === FASE 7: ENCOUNTERS === */
  
  async seedEncounters(startId, endId) {
    this.logProgress(`🌱 Seeding encounters ${startId} to ${endId}...`);
    
    let totalEncounters = 0;
    
    for (let id = startId; id <= endId; id++) {
      try {
        const encounters = await this.safeFetch(API(`pokemon/${id}/encounters`));
        if (!encounters || encounters.length === 0) continue;
        
        let encounterCount = 0;
        
        for (const encounter of encounters) {
          const locationAreaId = idFromUrl(encounter.location_area.url);
          
          // Asegurar location_area existe
          await this.db.query(`
            INSERT INTO location_area (id, name, location_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO NOTHING
          `, [locationAreaId, encounter.location_area.name, null]);
          
          for (const versionDetail of encounter.version_details || []) {
            const versionId = idFromUrl(versionDetail.version.url);
            
            for (const detail of versionDetail.encounter_details || []) {
              await this.db.query(`
                INSERT INTO pokemon_encounter 
                (pokemon_id, location_area_id, version_id, method, min_level, max_level, chance)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (pokemon_id, location_area_id, version_id, method) 
                DO UPDATE SET min_level = EXCLUDED.min_level, max_level = EXCLUDED.max_level, chance = EXCLUDED.chance
              `, [
                id,
                locationAreaId,
                versionId,
                detail.method?.name || 'walk',
                detail.min_level || null,
                detail.max_level || null,
                versionDetail.max_chance || null
              ]);
              encounterCount++;
            }
          }
        }
        
        if (encounterCount > 0) {
          totalEncounters += encounterCount;
          const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
          console.log(`[${elapsed}s] 📍 Pokemon #${id} → ${encounterCount} encounters`);
        }
        
      } catch (error) {
        // Encounters opcionales, continuar
      }
    }
    
    if (totalEncounters > 0) {
      console.log(`\n📊 Total encounters cargados: ${totalEncounters}\n`);
    }
  }

  /** === FASE 8: FLAVOR TEXTS (Descripciones en ES/EN) === */
  
  async seedFlavorTexts(startId, endId) {
    this.logProgress(`🌱 Seeding flavor texts ${startId} to ${endId}...`);
    
    let totalTexts = 0;
    
    for (let id = startId; id <= endId; id++) {
      try {
        const species = await this.safeFetch(API(`pokemon-species/${id}`));
        if (!species) continue;
        
        let textCount = 0;
        
        for (const entry of species.flavor_text_entries || []) {
          const lang = entry.language?.name;
          if (!lang || !['es', 'en'].includes(lang)) continue;
          
          const versionId = idFromUrl(entry.version.url);
          
          await this.db.query(`
            INSERT INTO pokemon_flavor_text (pokemon_id, version_id, language, flavor_text)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (pokemon_id, version_id, language) 
            DO UPDATE SET flavor_text = EXCLUDED.flavor_text
          `, [id, versionId, lang, entry.flavor_text]);
          textCount++;
        }
        
        if (textCount > 0) {
          totalTexts += textCount;
          const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
          console.log(`[${elapsed}s] 📝 Pokemon #${id} → ${textCount} descripciones (ES/EN)`);
        }
        
      } catch (error) {
        // Flavor texts opcionales
      }
    }
    
    if (totalTexts > 0) {
      console.log(`\n📊 Total descripciones cargadas: ${totalTexts}\n`);
    }
  }

  /** === ESTADÍSTICAS === */
  
  async showStats() {
    const stats = await Promise.all([
      this.db.get('SELECT COUNT(*) as count FROM pokemon'),
      this.db.get('SELECT COUNT(*) as count FROM type'),
      this.db.get('SELECT COUNT(*) as count FROM move'),
      this.db.get('SELECT COUNT(*) as count FROM item'),
      this.db.get('SELECT COUNT(*) as count FROM pokemon_move'),
      this.db.get('SELECT COUNT(*) as count FROM pokemon_type'),
      this.db.get('SELECT COUNT(*) as count FROM pokemon_held_item'),
      this.db.get('SELECT COUNT(*) as count FROM pokemon_encounter'),
      this.db.get('SELECT COUNT(*) as count FROM generation'),
      this.db.get('SELECT COUNT(*) as count FROM version_group'),
      this.db.get('SELECT COUNT(*) as count FROM version'),
      this.db.query('SELECT COUNT(*) as count FROM pokemon_flavor_text WHERE language = $1', ['es']).then(r => r.rows[0]),
      this.db.query('SELECT COUNT(*) as count FROM pokemon_flavor_text WHERE language = $1', ['en']).then(r => r.rows[0])
    ]);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BASE DE DATOS POKÉMON - ESTADÍSTICAS COMPLETAS');
    console.log('='.repeat(60));
    console.log(`🐾 Pokemon:                    ${stats[0].count}`);
    console.log(`⚡ Tipos:                       ${stats[1].count}`);
    console.log(`🥊 Movimientos:                 ${stats[2].count}`);
    console.log(`🎒 Items:                       ${stats[3].count}`);
    console.log(`📖 Pokemon-Movimientos:         ${stats[4].count}`);
    console.log(`🏷️  Pokemon-Tipos:               ${stats[5].count}`);
    console.log(`💎 Pokemon-Items equipados:     ${stats[6].count}`);
    console.log(`📍 Encuentros registrados:      ${stats[7].count}`);
    console.log(`🌍 Generaciones:                ${stats[8].count}`);
    console.log(`🎮 Grupos de versiones:         ${stats[9].count}`);
    console.log(`📀 Versiones:                   ${stats[10].count}`);
    console.log(`🇪🇸 Descripciones en Español:   ${stats[11].count}`);
    console.log(`🇬🇧 Descripciones en Inglés:    ${stats[12].count}`);
    console.log('='.repeat(60));
    console.log(`📊 Total requests:              ${this.requestCount}`);
    console.log(`⚠️  Total errors:                ${this.errorCount}`);
    console.log(`⏱️  Tiempo total:                ${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutos`);
    console.log('='.repeat(60) + '\n');
  }

  /** === EJECUTOR PRINCIPAL === */
  
  async seed(options = {}) {
    try {
      console.log('\n🚀 INICIANDO SEEDER COMPLETO DE POKÉAPI V2\n');
      
      await this.db.connect();
      await this.db.createPokemonTables();
      
      // FASE 1-5: Datos base (rápido) - solo si no existen
      const shouldSeedBase = await this.shouldSeedBaseData();
      
      if (shouldSeedBase) {
        console.log('📦 Cargando datos base (generaciones, tipos, moves, items)...\n');
        await this.seedGenerations();
        await this.seedVersionGroups();
        await this.seedTypes();
        await this.seedMoves();
        await this.seedItems();
      } else {
        console.log('✅ Datos base ya cargados, continuando con Pokemon...\n');
      }
      
      // FASE 6-8: Pokemon y datos relacionados (lento)
      if (options.genList) {
        // Opción para múltiples generaciones
        for (const gen of options.genList) {
          await this.seedGeneration(gen);
        }
      } else if (options.gen) {
        // Una sola generación
        await this.seedGeneration(options.gen);
      } else if (options.full) {
        // Todas las generaciones
        for (let gen = 1; gen <= 9; gen++) {
          await this.seedGeneration(gen);
        }
      } else {
        // Default: Gen 1-3
        for (let gen = 1; gen <= 3; gen++) {
          await this.seedGeneration(gen);
        }
      }
      
      // Estadísticas finales
      await this.showStats();
      
      console.log('✅ SEEDER COMPLETADO EXITOSAMENTE!\n');
      
    } catch (error) {
      console.error('\n❌ ERROR EN EL SEEDER:', error);
      throw error;
    } finally {
      await this.db.close();
    }
  }

  /** Verificar si los datos base ya están cargados */
  async shouldSeedBaseData() {
    try {
      const typeCount = await this.db.get('SELECT COUNT(*) as count FROM type');
      const genCount = await this.db.get('SELECT COUNT(*) as count FROM generation');
      
      // Si hay tipos y generaciones, asumimos que los datos base están cargados
      return typeCount.count < 10 || genCount.count < 5;
    } catch (error) {
      // Si hay error, probablemente las tablas no existen, cargar datos base
      return true;
    }
  }

  /** Seed de una generación completa */
  async seedGeneration(genNumber) {
    const range = CONFIG.GENERATION_RANGES[genNumber];
    if (!range) throw new Error(`Generación ${genNumber} no válida`);
    
    console.log('\n' + '='.repeat(70));
    console.log(`🎮 GENERACIÓN ${genNumber}: ${range.name.toUpperCase()}`);
    console.log(`📍 Pokemon #${range.start} - #${range.end} (${range.end - range.start + 1} Pokemon)`);
    console.log('='.repeat(70) + '\n');
    
    const startTime = Date.now();
    
    // Verificar si ya está cargada
    const existing = await this.db.get(`
      SELECT COUNT(*) as count 
      FROM pokemon 
      WHERE id BETWEEN $1 AND $2
    `, [range.start, range.end]);
    
    if (existing.count === (range.end - range.start + 1)) {
      console.log(`✅ Generación ${genNumber} ya está completamente cargada (${existing.count} Pokemon)`);
      console.log('⏭️  Saltando a la siguiente...\n');
      return;
    }
    
    if (existing.count > 0) {
      console.log(`📊 Generación ${genNumber} parcialmente cargada (${existing.count}/${range.end - range.start + 1})`);
      console.log('⚡ Continuando desde donde se quedó...\n');
    }
    
    // Cargar Pokemon
    await this.seedPokemonRange(range.start, range.end);
    await this.seedEncounters(range.start, range.end);
    await this.seedFlavorTexts(range.start, range.end);
    
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n' + '='.repeat(70));
    console.log(`✅ GENERACIÓN ${genNumber} COMPLETADA en ${elapsed} minutos`);
    console.log('='.repeat(70) + '\n');
  }

  getPokemonRange(options) {
    if (options.full) {
      return { startId: 1, endId: 1025 }; // Todos los Pokemon
    }
    
    if (options.gen) {
      const range = CONFIG.GENERATION_RANGES[options.gen];
      if (!range) throw new Error(`Generación ${options.gen} no válida`);
      console.log(`📍 Generación ${options.gen}: ${range.name}`);
      return { startId: range.start, endId: range.end };
    }
    
    // Default: Gen 1-3 (primeras 3 generaciones)
    return { startId: 1, endId: 386 };
  }
}

/** === EJECUTAR === */

if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse de argumentos
  const options = {
    full: args.includes('--full'),
    gen: null,
    genList: null
  };
  
  // Opción 1: --gen=N (una sola generación)
  const genArg = args.find(arg => arg.startsWith('--gen='));
  if (genArg) {
    options.gen = parseInt(genArg.split('=')[1]);
  }
  
  // Opción 2: --gens=1,2,3 (múltiples generaciones)
  const gensArg = args.find(arg => arg.startsWith('--gens='));
  if (gensArg) {
    options.genList = gensArg.split('=')[1].split(',').map(g => parseInt(g.trim()));
  }
  
  // Opción 3: --help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║          🎮 SEEDER DE POKÉAPI - MODO DE USO 🎮                  ║
╚══════════════════════════════════════════════════════════════════╝

📋 OPCIONES:

  --gen=N              Cargar solo la generación N (1-9)
                       Ejemplo: node seeders/pokeapi-complete.js --gen=1

  --gens=1,2,3         Cargar múltiples generaciones
                       Ejemplo: node seeders/pokeapi-complete.js --gens=1,2,3

  --full               Cargar TODAS las generaciones (1-9)
                       Ejemplo: node seeders/pokeapi-complete.js --full

  Sin argumentos       Cargar generaciones 1-3 (default)
                       Ejemplo: node seeders/pokeapi-complete.js

🎯 GENERACIONES DISPONIBLES:

  Gen 1 (Kanto)    → Pokemon #1-151     (151 Pokemon)
  Gen 2 (Johto)    → Pokemon #152-251   (100 Pokemon)
  Gen 3 (Hoenn)    → Pokemon #252-386   (135 Pokemon)
  Gen 4 (Sinnoh)   → Pokemon #387-493   (107 Pokemon)
  Gen 5 (Unova)    → Pokemon #494-649   (156 Pokemon)
  Gen 6 (Kalos)    → Pokemon #650-721   (72 Pokemon)
  Gen 7 (Alola)    → Pokemon #722-809   (88 Pokemon)
  Gen 8 (Galar)    → Pokemon #810-905   (96 Pokemon)
  Gen 9 (Paldea)   → Pokemon #906-1025  (120 Pokemon)

⚡ COMANDOS NPM:

  npm run seed:complete          → Gen 1-3 (default)
  npm run seed:complete:gen1     → Solo Gen 1
  npm run seed:complete:gen2     → Solo Gen 2
  npm run seed:complete:gen3     → Solo Gen 3
  npm run seed:complete:full     → TODAS las generaciones

💡 RECOMENDACIONES:

  - Primera vez: npm run seed:complete:gen1 (15 min)
  - Desarrollo: Cargar generaciones una por una
  - Producción: npm run seed:complete:full (2-4 horas)

✨ CARACTERÍSTICAS:

  ✅ Idempotente (puedes ejecutar varias veces)
  ✅ Detecta generaciones ya cargadas
  ✅ Continúa desde donde se quedó si se interrumpe
  ✅ Muestra progreso en tiempo real

════════════════════════════════════════════════════════════════════
`);
    process.exit(0);
  }
  
  const seeder = new PokeAPICompleteSeeder();
  seeder.seed(options).catch(error => {
    console.error('\n💥 ERROR FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = PokeAPICompleteSeeder;
