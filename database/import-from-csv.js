/**
 * Script para importar datos de PokeAPI desde archivos CSV
 * Alternativa a usar Docker - más ligero y rápido
 * 
 * Prerequisitos:
 * 1. Clonar repo: git clone https://github.com/PokeAPI/pokeapi.git --depth 1
 * 2. Los CSV deben estar en: ../pokeapi/data/v2/csv/
 * 
 * Uso: node database/import-from-csv.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CSV_BASE_PATH = path.join(__dirname, '..', '..', 'pokeapi', 'data', 'v2', 'csv');

// Mapeo de archivos CSV a tablas (orden importa por foreign keys)
const IMPORT_ORDER = [
  // Datos base sin dependencias
  { csv: 'languages.csv', table: 'pokemon_v2_language' },
  { csv: 'generations.csv', table: 'pokemon_v2_generation' },
  { csv: 'versions.csv', table: 'pokemon_v2_version' },
  { csv: 'version_groups.csv', table: 'pokemon_v2_versiongroup' },
  { csv: 'types.csv', table: 'pokemon_v2_type' },
  { csv: 'abilities.csv', table: 'pokemon_v2_ability' },
  { csv: 'items.csv', table: 'pokemon_v2_item' },
  { csv: 'moves.csv', table: 'pokemon_v2_move' },
  
  // Pokemon y especies
  { csv: 'pokemon_species.csv', table: 'pokemon_v2_pokemonspecies' },
  { csv: 'pokemon.csv', table: 'pokemon_v2_pokemon' },
  
  // Relaciones
  { csv: 'pokemon_types.csv', table: 'pokemon_v2_pokemontype' },
  { csv: 'pokemon_abilities.csv', table: 'pokemon_v2_pokemonability' },
  { csv: 'pokemon_moves.csv', table: 'pokemon_v2_pokemonmove' },
  { csv: 'pokemon_stats.csv', table: 'pokemon_v2_pokemonstat' },
];

class CSVImporter {
  constructor() {
    this.totalRows = 0;
    this.startTime = Date.now();
  }

  async connect() {
    await pool.connect();
    console.log('✅ Conectado a PostgreSQL:', new Date().toISOString());
  }

  async close() {
    await pool.end();
    console.log('✅ Conexión cerrada');
  }

  /**
   * Lee un archivo CSV y retorna array de objetos
   */
  async readCSV(csvPath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Importa un archivo CSV a una tabla
   */
  async importTable(csvFile, tableName) {
    const csvPath = path.join(CSV_BASE_PATH, csvFile);
    
    if (!fs.existsSync(csvPath)) {
      console.warn(`⚠️  ${csvFile} no encontrado, saltando...`);
      return 0;
    }

    console.log(`\n📥 Importando ${csvFile} → ${tableName}...`);
    
    const rows = await this.readCSV(csvPath);
    
    if (rows.length === 0) {
      console.log(`⏭️  ${csvFile} vacío, saltando...`);
      return 0;
    }

    // Obtener columnas del primer row
    const columns = Object.keys(rows[0]);
    
    // Crear placeholders para prepared statement
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${columnNames})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;

    let imported = 0;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const row of rows) {
        const values = columns.map(col => {
          const value = row[col];
          // Convertir empty strings a null
          if (value === '' || value === undefined) return null;
          // Convertir 't'/'f' a boolean
          if (value === 't') return true;
          if (value === 'f') return false;
          return value;
        });
        
        try {
          await client.query(query, values);
          imported++;
        } catch (error) {
          // Ignorar errores de constraint (datos que ya existen)
          if (!error.message.includes('duplicate key')) {
            console.error(`Error en row:`, values);
            throw error;
          }
        }
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ ${imported}/${rows.length} rows importados`);
      this.totalRows += imported;
      
      return imported;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error importando ${csvFile}:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Crea el schema de PokeAPI v2
   */
  async createSchema() {
    console.log('🔨 Creando schema de PokeAPI v2...');
    
    // Aquí iría el schema completo de PokeAPI
    // Por ahora, asumimos que ya existe o usamos el del repo oficial
    
    console.log('⏭️  Asumiendo schema ya existe (usa el dump de schema del repo oficial)');
  }

  /**
   * Ejecuta la importación completa
   */
  async import() {
    console.log('\n🚀 INICIANDO IMPORTACIÓN DESDE CSV\n');
    console.log(`📂 CSV Path: ${CSV_BASE_PATH}\n`);
    
    // Verificar que existe el directorio
    if (!fs.existsSync(CSV_BASE_PATH)) {
      throw new Error(
        `❌ Directorio no encontrado: ${CSV_BASE_PATH}\n\n` +
        `Por favor clona el repositorio:\n` +
        `  cd ${path.dirname(CSV_BASE_PATH)}\n` +
        `  git clone https://github.com/PokeAPI/pokeapi.git --depth 1`
      );
    }

    await this.connect();
    
    try {
      await this.createSchema();
      
      // Importar en orden
      for (const { csv, table } of IMPORT_ORDER) {
        await this.importTable(csv, table);
      }
      
      const elapsed = ((Date.now() - this.startTime) / 1000 / 60).toFixed(2);
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ IMPORTACIÓN COMPLETADA');
      console.log('='.repeat(60));
      console.log(`📊 Total rows importados: ${this.totalRows}`);
      console.log(`⏱️  Tiempo total: ${elapsed} minutos`);
      console.log('='.repeat(60) + '\n');
      
    } catch (error) {
      console.error('\n❌ ERROR EN IMPORTACIÓN:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const importer = new CSVImporter();
  importer.import().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = CSVImporter;
