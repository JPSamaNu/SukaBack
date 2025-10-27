const { Client } = require('pg');

const client = new Client({
  host: 'sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'sukadb',
  user: 'suka',
  password: 'SukaBliat123',
  ssl: {
    rejectUnauthorized: false
  }
});

async function exploreEvolutionStructure() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // pokemon_v2_evolutionchain
    console.log('='.repeat(60));
    console.log('📊 Estructura de pokemon_v2_evolutionchain:');
    console.log('='.repeat(60));
    const chain_structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pokemon_v2_evolutionchain'
      ORDER BY ordinal_position
    `);
    chain_structure.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    const chain_example = await client.query('SELECT * FROM pokemon_v2_evolutionchain LIMIT 3');
    console.log('\n🔍 Ejemplos:');
    console.log(JSON.stringify(chain_example.rows, null, 2));

    // pokemon_v2_pokemonevolution
    console.log('\n' + '='.repeat(60));
    console.log('📊 Estructura de pokemon_v2_pokemonevolution:');
    console.log('='.repeat(60));
    const evo_structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pokemon_v2_pokemonevolution'
      ORDER BY ordinal_position
    `);
    evo_structure.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    console.log('\n🔍 Ejemplos (Bulbasaur line - species_id 1-3):');
    const evo_examples = await client.query(`
      SELECT * FROM pokemon_v2_pokemonevolution 
      WHERE pokemon_species_id IN (1, 2, 3)
      ORDER BY pokemon_species_id
    `);
    console.log(JSON.stringify(evo_examples.rows, null, 2));

    console.log('\n🔍 Ejemplos (Pikachu - species_id 25):');
    const pikachu_evo = await client.query(`
      SELECT * FROM pokemon_v2_pokemonevolution 
      WHERE pokemon_species_id = 25 OR evolved_species_id = 25
    `);
    console.log(JSON.stringify(pikachu_evo.rows, null, 2));

    // pokemon_v2_evolutiontrigger
    console.log('\n' + '='.repeat(60));
    console.log('📊 Evolution Triggers disponibles:');
    console.log('='.repeat(60));
    const triggers = await client.query('SELECT * FROM pokemon_v2_evolutiontrigger ORDER BY id');
    triggers.rows.forEach(row => {
      console.log(`   ${row.id}: ${row.name}`);
    });

    // Verificar relación con pokemon_species
    console.log('\n' + '='.repeat(60));
    console.log('🔗 Relación completa: Bulbasaur evolution chain');
    console.log('='.repeat(60));
    const bulbasaur_chain = await client.query(`
      SELECT 
        pe.id,
        ps1.id as pokemon_species_id,
        ps1.name as pokemon_name,
        ps2.id as evolved_species_id,
        ps2.name as evolved_name,
        pe.min_level,
        pe.evolution_item_id,
        pet.name as trigger_name,
        pe.min_happiness,
        pe.min_beauty,
        pe.min_affection,
        pe.time_of_day,
        pe.evolution_chain_id
      FROM pokemon_v2_pokemonevolution pe
      JOIN pokemon_v2_pokemonspecies ps1 ON pe.pokemon_species_id = ps1.id
      LEFT JOIN pokemon_v2_pokemonspecies ps2 ON pe.evolved_species_id = ps2.id
      LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
      WHERE pe.evolution_chain_id = 1
      ORDER BY ps1.id
    `);
    console.log(JSON.stringify(bulbasaur_chain.rows, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

exploreEvolutionStructure();
