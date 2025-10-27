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

async function checkEvolutionTables() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Buscar tablas de evolución
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%evolution%'
      ORDER BY table_name
    `;
    
    const tables = await client.query(tablesQuery);
    console.log('📋 Tablas de evolución encontradas:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
    // Ver estructura de evolution_chains
    if (tables.rows.some(r => r.table_name === 'evolution_chains')) {
      console.log('\n📊 Estructura de evolution_chains:');
      const structureQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'evolution_chains'
        ORDER BY ordinal_position
      `;
      const structure = await client.query(structureQuery);
      structure.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
      
      // Ver un ejemplo
      console.log('\n🔍 Ejemplo de evolution_chains:');
      const example = await client.query('SELECT * FROM evolution_chains LIMIT 1');
      console.log(JSON.stringify(example.rows[0], null, 2));
    }

    // Ver estructura de pokemon_evolution
    if (tables.rows.some(r => r.table_name === 'pokemon_evolution')) {
      console.log('\n📊 Estructura de pokemon_evolution:');
      const structureQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'pokemon_evolution'
        ORDER BY ordinal_position
      `;
      const structure = await client.query(structureQuery);
      structure.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
      
      // Ver ejemplos
      console.log('\n🔍 Ejemplos de pokemon_evolution (primeros 5):');
      const examples = await client.query('SELECT * FROM pokemon_evolution LIMIT 5');
      console.log(JSON.stringify(examples.rows, null, 2));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkEvolutionTables();
