const { Client } = require('pg');

const client = new Client({
  host: 'sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'sukadb',
  user: 'suka',
  password: 'SukaBliat123',
  ssl: { rejectUnauthorized: false }
});

async function checkMovesTables() {
  await client.connect();
  
  console.log('🔍 Buscando tablas relacionadas con movimientos...\n');
  
  // Buscar todas las tablas que contengan "move" en el nombre
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%move%'
    ORDER BY table_name
  `);
  
  console.log('📋 Tablas encontradas:');
  tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
  
  // Ver estructura de la tabla principal de movimientos
  if (tables.rows.length > 0) {
    const mainTable = tables.rows.find(r => r.table_name === 'pokemon_v2_move') || tables.rows[0];
    console.log(`\n📊 Estructura de ${mainTable.table_name}:`);
    
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [mainTable.table_name]);
    
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Ver algunos ejemplos de datos
    console.log(`\n📝 Ejemplos de movimientos (primeros 5):`);
    const examples = await client.query(`
      SELECT * FROM ${mainTable.table_name} LIMIT 5
    `);
    
    console.log(JSON.stringify(examples.rows, null, 2));
  }
  
  await client.end();
}

checkMovesTables().catch(console.error);
