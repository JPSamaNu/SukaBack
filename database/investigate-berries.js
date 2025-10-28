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

async function investigateBerries() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Buscar tablas relacionadas con berries
    console.log('📊 TABLAS DE BERRIES:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%berry%' 
      ORDER BY table_name
    `);
    
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // 2. Ver estructura de la tabla principal
    console.log('\n📋 ESTRUCTURA DE pokemon_v2_berry:');
    const structure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pokemon_v2_berry' 
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // 3. Ver algunos ejemplos de berries
    console.log('\n🍓 EJEMPLOS DE BERRIES:');
    const berries = await client.query(`
      SELECT * FROM pokemon_v2_berry 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log(JSON.stringify(berries.rows, null, 2));

    // 4. Ver si hay tabla de nombres/descripciones
    console.log('\n📝 NOMBRES DE BERRIES:');
    const names = await client.query(`
      SELECT * FROM pokemon_v2_berryname 
      ORDER BY berry_id 
      LIMIT 5
    `);
    
    console.log(JSON.stringify(names.rows, null, 2));

    // 5. Ver firmness (firmeza)
    console.log('\n💪 FIRMNESS:');
    const firmness = await client.query(`
      SELECT id, name FROM pokemon_v2_berryfirmness 
      ORDER BY id
    `);
    
    console.log(JSON.stringify(firmness.rows, null, 2));

    // 6. Ver flavors (sabores)
    console.log('\n🍬 FLAVORS:');
    const flavors = await client.query(`
      SELECT id, name FROM pokemon_v2_berryflavor 
      ORDER BY id
    `);
    
    console.log(JSON.stringify(flavors.rows, null, 2));

    // 7. Contar total de berries
    console.log('\n📊 ESTADÍSTICAS:');
    const count = await client.query(`SELECT COUNT(*) as total FROM pokemon_v2_berry`);
    console.log(`Total de berries: ${count.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

investigateBerries();
