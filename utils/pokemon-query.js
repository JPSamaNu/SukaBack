/**
 * Utilidad para consultar Pokemon en la base de datos
 * 
 * Uso:
 *   node utils/pokemon-query.js stats
 *   node utils/pokemon-query.js pokemon 25
 *   node utils/pokemon-query.js search pikachu
 *   node utils/pokemon-query.js types
 */

const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

class PokemonQuery {
  constructor() {
    this.db = new PostgresDatabase();
  }

  async showStats() {
    console.log('\n📊 Estadísticas de la Base de Datos Pokemon\n');
    
    const queries = [
      { name: 'Pokemon', query: 'SELECT COUNT(*) as count FROM pokemon' },
      { name: 'Tipos', query: 'SELECT COUNT(*) as count FROM type' },
      { name: 'Movimientos', query: 'SELECT COUNT(*) as count FROM move' },
      { name: 'Items', query: 'SELECT COUNT(*) as count FROM item' },
      { name: 'Generaciones', query: 'SELECT COUNT(*) as count FROM generation' },
      { name: 'Versiones', query: 'SELECT COUNT(*) as count FROM version' }
    ];

    for (const q of queries) {
      try {
        const result = await this.db.get(q.query);
        console.log(`${q.name.padEnd(20)} : ${result.count}`);
      } catch (error) {
        console.log(`${q.name.padEnd(20)} : Error`);
      }
    }
    
    console.log('');
  }

  async getPokemonById(id) {
    console.log(`\n🔍 Buscando Pokemon #${id}...\n`);
    
    const pokemon = await this.db.get('SELECT * FROM pokemon WHERE id = $1', [id]);
    
    if (!pokemon) {
      console.log('❌ Pokemon no encontrado\n');
      return;
    }

    console.log(`📛 Nombre: ${pokemon.name}`);
    console.log(`📏 Altura: ${pokemon.height}`);
    console.log(`⚖️  Peso: ${pokemon.weight}`);
    console.log(`⭐ Exp base: ${pokemon.base_experience}`);
    
    // Tipos
    const types = await this.db.all(`
      SELECT t.name 
      FROM pokemon_type pt 
      JOIN type t ON pt.type_id = t.id 
      WHERE pt.pokemon_id = $1 
      ORDER BY pt.slot
    `, [id]);
    
    if (types.length > 0) {
      console.log(`⚡ Tipos: ${types.map(t => t.name).join(', ')}`);
    }
    
    // Movimientos
    const moves = await this.db.all(`
      SELECT m.name, pm.learn_method, pm.level
      FROM pokemon_move pm
      JOIN move m ON pm.move_id = m.id
      WHERE pm.pokemon_id = $1
      LIMIT 10
    `, [id]);
    
    if (moves.length > 0) {
      console.log(`\n🥊 Movimientos (primeros 10):`);
      moves.forEach(m => {
        const level = m.level ? `Nivel ${m.level}` : m.learn_method;
        console.log(`   - ${m.name} (${level})`);
      });
    }
    
    console.log('');
  }

  async searchPokemon(name) {
    console.log(`\n🔍 Buscando Pokemon con nombre: "${name}"...\n`);
    
    const results = await this.db.all(
      'SELECT id, name FROM pokemon WHERE name ILIKE $1 LIMIT 10',
      [`%${name}%`]
    );
    
    if (results.length === 0) {
      console.log('❌ No se encontraron Pokemon\n');
      return;
    }

    console.log(`✅ Encontrados ${results.length} Pokemon:\n`);
    results.forEach(p => {
      console.log(`   #${p.id.toString().padStart(3, '0')} - ${p.name}`);
    });
    console.log('');
  }

  async listTypes() {
    console.log('\n⚡ Tipos de Pokemon:\n');
    
    const types = await this.db.all('SELECT id, name FROM type ORDER BY id');
    
    types.forEach(t => {
      console.log(`   ${t.id.toString().padStart(2, ' ')}. ${t.name}`);
    });
    console.log('');
  }

  async run(args) {
    try {
      await this.db.connect();

      const command = args[0] || 'stats';

      switch (command) {
        case 'stats':
          await this.showStats();
          break;
        
        case 'pokemon':
          if (!args[1]) {
            console.log('❌ Falta el ID del Pokemon');
            console.log('Uso: node utils/pokemon-query.js pokemon <id>');
            break;
          }
          await this.getPokemonById(parseInt(args[1]));
          break;
        
        case 'search':
          if (!args[1]) {
            console.log('❌ Falta el nombre a buscar');
            console.log('Uso: node utils/pokemon-query.js search <nombre>');
            break;
          }
          await this.searchPokemon(args[1]);
          break;
        
        case 'types':
          await this.listTypes();
          break;
        
        default:
          console.log('❌ Comando no reconocido');
          console.log('\nComandos disponibles:');
          console.log('  stats          - Mostrar estadísticas');
          console.log('  pokemon <id>   - Buscar Pokemon por ID');
          console.log('  search <name>  - Buscar Pokemon por nombre');
          console.log('  types          - Listar todos los tipos');
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      await this.db.close();
    }
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const query = new PokemonQuery();
  query.run(args);
}

module.exports = PokemonQuery;
