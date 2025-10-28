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

async function testQuery() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Probar el query exacto que está usando el servicio
    console.log('🔍 Probando query de berries...\n');
    const result = await client.query(`
      SELECT 
        b.id,
        b.name,
        b.natural_gift_power,
        b.size,
        b.max_harvest,
        b.growth_time,
        b.soil_dryness,
        b.smoothness,
        bf.name as firmness,
        t.name as natural_gift_type,
        i.sprites
      FROM pokemon_v2_berry b
      LEFT JOIN pokemon_v2_berryfirmness bf ON b.berry_firmness_id = bf.id
      LEFT JOIN pokemon_v2_type t ON b.natural_gift_type_id = t.id
      LEFT JOIN pokemon_v2_item i ON b.item_id = i.id
      WHERE 1=1
      ORDER BY b.id ASC 
      LIMIT 5
    `);

    console.log('✅ Query exitoso!');
    console.log('Resultados:', result.rows.length);
    console.log('\nPrimera berry:');
    console.log(JSON.stringify(result.rows[0], null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalle:', error.detail);
  } finally {
    await client.end();
  }
}

testQuery();
