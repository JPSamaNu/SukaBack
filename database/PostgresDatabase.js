/**
 * PostgresDatabase - Gestor de conexión y operaciones con PostgreSQL
 * Para el seeder de PokéAPI v2
 */

const { Pool } = require('pg');
require('dotenv').config();

class PostgresDatabase {
  constructor(config = {}) {
    this.config = {
      connectionString: process.env.DATABASE_URL,
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || process.env.DB_PORT || 5432,
      user: config.user || process.env.DB_USERNAME || 'postgres',
      password: config.password || process.env.DB_PASSWORD || '',
      database: config.database || process.env.DB_NAME || 'sukadb',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // SSL siempre habilitado para AWS RDS, pero sin verificar certificado
      ssl: {
        rejectUnauthorized: false
      }
    };

    this.pool = null;
  }

  async connect() {
    try {
      // Usar DATABASE_URL si está disponible (preferido para AWS RDS)
      if (this.config.connectionString) {
        this.pool = new Pool({
          connectionString: this.config.connectionString,
          ssl: this.config.ssl
        });
      } else {
        this.pool = new Pool(this.config);
      }

      // Test de conexión
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      console.log('✅ PostgreSQL conectado:', result.rows[0].now);
      client.release();

      return this.pool;
    } catch (error) {
      console.error('❌ Error conectando a PostgreSQL:', error.message);
      throw error;
    }
  }

  async query(text, params) {
    if (!this.pool) {
      throw new Error('Base de datos no conectada. Llama a connect() primero.');
    }
    
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Error en query:', error.message);
      console.error('SQL:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  async get(text, params) {
    const result = await this.query(text, params);
    return result.rows[0];
  }

  async all(text, params) {
    const result = await this.query(text, params);
    return result.rows;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ PostgreSQL desconectado');
    }
  }

  /** Crear todas las tablas necesarias para Pokemon */
  async createPokemonTables() {
    console.log('🔨 Creando tablas de Pokemon...');

    const tables = [
      // Generaciones
      `CREATE TABLE IF NOT EXISTS generation (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      )`,

      // Grupos de versiones
      `CREATE TABLE IF NOT EXISTS version_group (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        generation_id INTEGER REFERENCES generation(id)
      )`,

      // Versiones de juegos
      `CREATE TABLE IF NOT EXISTS version (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        version_group_id INTEGER REFERENCES version_group(id)
      )`,

      // Tipos
      `CREATE TABLE IF NOT EXISTS type (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      )`,

      // Movimientos
      `CREATE TABLE IF NOT EXISTS move (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        accuracy INTEGER,
        power INTEGER,
        pp INTEGER,
        type_id INTEGER REFERENCES type(id)
      )`,

      // Items
      `CREATE TABLE IF NOT EXISTS item (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )`,

      // Pokemon
      `CREATE TABLE IF NOT EXISTS pokemon (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        height INTEGER,
        weight INTEGER,
        base_experience INTEGER,
        sprite_url TEXT
      )`,

      // Pokemon-Tipos (relación muchos a muchos)
      `CREATE TABLE IF NOT EXISTS pokemon_type (
        pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
        type_id INTEGER REFERENCES type(id) ON DELETE CASCADE,
        slot INTEGER NOT NULL,
        PRIMARY KEY (pokemon_id, type_id, slot)
      )`,

      // Pokemon-Movimientos (relación muchos a muchos con versión)
      `CREATE TABLE IF NOT EXISTS pokemon_move (
        pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
        move_id INTEGER REFERENCES move(id) ON DELETE CASCADE,
        version_group_id INTEGER REFERENCES version_group(id) ON DELETE CASCADE,
        learn_method VARCHAR(50),
        level INTEGER,
        PRIMARY KEY (pokemon_id, move_id, version_group_id, learn_method)
      )`,

      // Items equipados por Pokemon
      `CREATE TABLE IF NOT EXISTS pokemon_held_item (
        pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES item(id) ON DELETE CASCADE,
        version_id INTEGER REFERENCES version(id) ON DELETE CASCADE,
        rarity INTEGER DEFAULT 0,
        PRIMARY KEY (pokemon_id, item_id, version_id)
      )`,

      // Ubicaciones/Áreas
      `CREATE TABLE IF NOT EXISTS location_area (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location_id INTEGER
      )`,

      // Encuentros de Pokemon
      `CREATE TABLE IF NOT EXISTS pokemon_encounter (
        pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
        location_area_id INTEGER REFERENCES location_area(id) ON DELETE CASCADE,
        version_id INTEGER REFERENCES version(id) ON DELETE CASCADE,
        method VARCHAR(50),
        min_level INTEGER,
        max_level INTEGER,
        chance INTEGER,
        PRIMARY KEY (pokemon_id, location_area_id, version_id, method)
      )`,

      // Flavor texts (descripciones)
      `CREATE TABLE IF NOT EXISTS pokemon_flavor_text (
        pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
        version_id INTEGER REFERENCES version(id) ON DELETE CASCADE,
        language VARCHAR(10),
        flavor_text TEXT,
        PRIMARY KEY (pokemon_id, version_id, language)
      )`,

      // Índices para mejorar performance
      `CREATE INDEX IF NOT EXISTS idx_pokemon_name ON pokemon(name)`,
      `CREATE INDEX IF NOT EXISTS idx_pokemon_type_pokemon ON pokemon_type(pokemon_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pokemon_type_type ON pokemon_type(type_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pokemon_move_pokemon ON pokemon_move(pokemon_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pokemon_move_move ON pokemon_move(move_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pokemon_encounter_pokemon ON pokemon_encounter(pokemon_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pokemon_flavor_pokemon ON pokemon_flavor_text(pokemon_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pokemon_flavor_lang ON pokemon_flavor_text(language)`
    ];

    for (const sql of tables) {
      try {
        await this.query(sql);
      } catch (error) {
        console.error('Error creando tabla:', error.message);
        throw error;
      }
    }

    console.log('✅ Tablas de Pokemon creadas/verificadas');
  }

  /** Limpiar todas las tablas (útil para reiniciar) */
  async clearAllTables() {
    console.log('🗑️  Limpiando todas las tablas...');

    const tables = [
      'pokemon_flavor_text',
      'pokemon_encounter',
      'pokemon_held_item',
      'pokemon_move',
      'pokemon_type',
      'pokemon',
      'location_area',
      'item',
      'move',
      'version',
      'version_group',
      'type',
      'generation'
    ];

    for (const table of tables) {
      try {
        await this.query(`TRUNCATE TABLE ${table} CASCADE`);
      } catch (error) {
        // Tabla no existe, continuar
      }
    }

    console.log('✅ Tablas limpiadas');
  }
}

module.exports = PostgresDatabase;
