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

async function testEvolutionQuery() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Ver datos de ejemplo
    console.log('🔍 Primeros 10 registros de pokemon_v2_pokemonevolution:');
    const examples = await client.query(`
      SELECT * FROM pokemon_v2_pokemonevolution 
      ORDER BY id 
      LIMIT 10
    `);
    console.log(JSON.stringify(examples.rows, null, 2));

    // Ver triggers
    console.log('\n📋 Evolution Triggers:');
    const triggers = await client.query('SELECT * FROM pokemon_v2_evolutiontrigger');
    console.log(JSON.stringify(triggers.rows, null, 2));

    // Verificar si existe pokemon_v2_pokemonspecies
    console.log('\n🔍 Buscando tabla de species:');
    const species_table = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%species%'
    `);
    console.log('Tablas encontradas:', species_table.rows.map(r => r.table_name));

    if (species_table.rows.length > 0) {
      console.log('\n📊 Estructura de pokemon_v2_pokemonspecies:');
      const species_structure = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'pokemon_v2_pokemonspecies'
        ORDER BY ordinal_position
        LIMIT 10
      `);
      species_structure.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });

      console.log('\n🔍 Ejemplos de pokemon_v2_pokemonspecies (primeros 5):');
      const species_examples = await client.query(`
        SELECT id, name, evolution_chain_id 
        FROM pokemon_v2_pokemonspecies 
        ORDER BY id 
        LIMIT 5
      `);
      console.log(JSON.stringify(species_examples.rows, null, 2));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

testEvolutionQuery();
