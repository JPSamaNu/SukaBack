/**
 * Script para añadir tablas personalizadas a la base de datos PokeAPI
 * Estas tablas coexisten con las de PokeAPI sin modificarlas
 * 
 * Uso: node database/create-custom-tables.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class CustomTableCreator {
  async connect() {
    await pool.connect();
    console.log('✅ Conectado a PostgreSQL');
  }

  async close() {
    await pool.end();
    console.log('✅ Conexión cerrada');
  }

  async createCustomTables() {
    console.log('\n🔨 Creando tablas personalizadas...\n');

    const tables = [
      {
        name: 'user_favorites',
        description: 'Pokemon favoritos de usuarios',
        sql: `
          CREATE TABLE IF NOT EXISTS user_favorites (
            user_id INTEGER NOT NULL,
            pokemon_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (user_id, pokemon_id),
            FOREIGN KEY (pokemon_id) REFERENCES pokemon(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_favorites_pokemon ON user_favorites(pokemon_id);
        `
      },
      {
        name: 'user_teams',
        description: 'Equipos de Pokemon de usuarios',
        sql: `
          CREATE TABLE IF NOT EXISTS user_teams (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name VARCHAR(50) NOT NULL,
            description TEXT,
            is_public BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_user_teams_user ON user_teams(user_id);
        `
      },
      {
        name: 'team_members',
        description: 'Miembros de equipos (Pokemon)',
        sql: `
          CREATE TABLE IF NOT EXISTS team_members (
            team_id INTEGER NOT NULL REFERENCES user_teams(id) ON DELETE CASCADE,
            position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 6),
            pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
            nickname VARCHAR(50),
            level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 100),
            PRIMARY KEY (team_id, position)
          );
          CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
          CREATE INDEX IF NOT EXISTS idx_team_members_pokemon ON team_members(pokemon_id);
        `
      },
      {
        name: 'battle_history',
        description: 'Historial de batallas entre usuarios',
        sql: `
          CREATE TABLE IF NOT EXISTS battle_history (
            id SERIAL PRIMARY KEY,
            team1_id INTEGER NOT NULL REFERENCES user_teams(id),
            team2_id INTEGER NOT NULL REFERENCES user_teams(id),
            winner_team_id INTEGER REFERENCES user_teams(id),
            battle_data JSONB, -- Datos detallados de la batalla
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_battle_history_team1 ON battle_history(team1_id);
          CREATE INDEX IF NOT EXISTS idx_battle_history_team2 ON battle_history(team2_id);
          CREATE INDEX IF NOT EXISTS idx_battle_history_date ON battle_history(created_at DESC);
        `
      },
      {
        name: 'pokemon_ratings',
        description: 'Ratings y reviews de Pokemon por usuarios',
        sql: `
          CREATE TABLE IF NOT EXISTS pokemon_ratings (
            user_id INTEGER NOT NULL,
            pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            review TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (user_id, pokemon_id)
          );
          CREATE INDEX IF NOT EXISTS idx_pokemon_ratings_pokemon ON pokemon_ratings(pokemon_id);
          CREATE INDEX IF NOT EXISTS idx_pokemon_ratings_rating ON pokemon_ratings(rating DESC);
        `
      },
      {
        name: 'custom_pokemon_nicknames',
        description: 'Apodos y metadata personalizada de Pokemon capturados',
        sql: `
          CREATE TABLE IF NOT EXISTS custom_pokemon_nicknames (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
            nickname VARCHAR(50) NOT NULL,
            captured_at TIMESTAMP DEFAULT NOW(),
            location VARCHAR(100),
            notes TEXT,
            is_shiny BOOLEAN DEFAULT false,
            UNIQUE(user_id, pokemon_id, nickname)
          );
          CREATE INDEX IF NOT EXISTS idx_custom_nicknames_user ON custom_pokemon_nicknames(user_id);
          CREATE INDEX IF NOT EXISTS idx_custom_nicknames_pokemon ON custom_pokemon_nicknames(pokemon_id);
        `
      },
      {
        name: 'user_achievements',
        description: 'Logros/achievements de usuarios',
        sql: `
          CREATE TABLE IF NOT EXISTS user_achievements (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            achievement_type VARCHAR(50) NOT NULL, -- 'pokedex_complete', 'first_team', etc.
            pokemon_id INTEGER REFERENCES pokemon(id), -- Pokemon relacionado (opcional)
            metadata JSONB, -- Datos adicionales del logro
            unlocked_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, achievement_type, pokemon_id)
          );
          CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);
        `
      },
      {
        name: 'pokemon_encounters_log',
        description: 'Log de encuentros/capturas de Pokemon',
        sql: `
          CREATE TABLE IF NOT EXISTS pokemon_encounters_log (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
            encounter_type VARCHAR(20) NOT NULL, -- 'wild', 'trade', 'gift', etc.
            location VARCHAR(100),
            level INTEGER,
            was_caught BOOLEAN DEFAULT false,
            encountered_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_encounters_user ON pokemon_encounters_log(user_id);
          CREATE INDEX IF NOT EXISTS idx_encounters_pokemon ON pokemon_encounters_log(pokemon_id);
          CREATE INDEX IF NOT EXISTS idx_encounters_date ON pokemon_encounters_log(encountered_at DESC);
        `
      }
    ];

    let created = 0;
    let errors = 0;

    for (const table of tables) {
      try {
        console.log(`📋 Creando: ${table.name} (${table.description})`);
        await pool.query(table.sql);
        console.log(`   ✅ ${table.name} creada/verificada\n`);
        created++;
      } catch (error) {
        console.error(`   ❌ Error creando ${table.name}:`, error.message);
        errors++;
      }
    }

    console.log('='.repeat(60));
    console.log(`📊 Resultado: ${created} tablas creadas, ${errors} errores`);
    console.log('='.repeat(60) + '\n');
  }

  async createViews() {
    console.log('\n🔍 Creando vistas útiles...\n');

    const views = [
      {
        name: 'v_pokemon_full',
        description: 'Vista completa de Pokemon con tipos',
        sql: `
          CREATE OR REPLACE VIEW v_pokemon_full AS
          SELECT 
            p.id,
            p.name,
            p.height,
            p.weight,
            p.base_experience,
            p.sprite_url,
            ARRAY_AGG(DISTINCT t.name ORDER BY t.name) as types,
            COUNT(DISTINCT pm.move_id) as total_moves
          FROM pokemon p
          LEFT JOIN pokemon_type pt ON p.id = pt.pokemon_id
          LEFT JOIN type t ON pt.type_id = t.id
          LEFT JOIN pokemon_move pm ON p.id = pm.pokemon_id
          GROUP BY p.id, p.name, p.height, p.weight, p.base_experience, p.sprite_url;
        `
      },
      {
        name: 'v_team_summary',
        description: 'Resumen de equipos con Pokemon',
        sql: `
          CREATE OR REPLACE VIEW v_team_summary AS
          SELECT 
            ut.id as team_id,
            ut.user_id,
            ut.name as team_name,
            ut.is_public,
            COUNT(tm.pokemon_id) as pokemon_count,
            ARRAY_AGG(p.name ORDER BY tm.position) as pokemon_names
          FROM user_teams ut
          LEFT JOIN team_members tm ON ut.id = tm.team_id
          LEFT JOIN pokemon p ON tm.pokemon_id = p.id
          GROUP BY ut.id, ut.user_id, ut.name, ut.is_public;
        `
      },
      {
        name: 'v_pokemon_ratings_avg',
        description: 'Rating promedio por Pokemon',
        sql: `
          CREATE OR REPLACE VIEW v_pokemon_ratings_avg AS
          SELECT 
            p.id as pokemon_id,
            p.name as pokemon_name,
            COUNT(pr.user_id) as rating_count,
            ROUND(AVG(pr.rating), 2) as avg_rating
          FROM pokemon p
          LEFT JOIN pokemon_ratings pr ON p.id = pr.pokemon_id
          GROUP BY p.id, p.name
          HAVING COUNT(pr.user_id) > 0;
        `
      }
    ];

    let created = 0;

    for (const view of views) {
      try {
        console.log(`👁️  Creando: ${view.name} (${view.description})`);
        await pool.query(view.sql);
        console.log(`   ✅ ${view.name} creada\n`);
        created++;
      } catch (error) {
        console.error(`   ❌ Error creando ${view.name}:`, error.message);
      }
    }

    console.log(`📊 ${created} vistas creadas\n`);
  }

  async run() {
    try {
      console.log('\n🚀 CREANDO ESTRUCTURA PERSONALIZADA\n');
      
      await this.connect();
      await this.createCustomTables();
      await this.createViews();
      
      console.log('\n✅ ESTRUCTURA PERSONALIZADA COMPLETADA\n');
      
    } catch (error) {
      console.error('\n❌ ERROR:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const creator = new CustomTableCreator();
  creator.run().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = CustomTableCreator;
