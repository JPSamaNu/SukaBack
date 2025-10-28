const { Client } = require('pg');

const client = new Client({
  host: 'sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'sukadb',
  user: 'suka',
  password: 'SukaBliat123',
  ssl: { rejectUnauthorized: false }
});

async function investigateMegaEvolutions() {
  await client.connect();
  
  console.log('🔍 Investigando Mega Evoluciones...\n');
  
  // Buscar tablas relacionadas con "form" o "variety"
  console.log('📋 Buscando tablas relacionadas con formas/variedades:');
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE '%form%' OR table_name LIKE '%variety%')
    ORDER BY table_name
  `);
  
  tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
  
  // Buscar Charizard y sus formas (tiene Mega X y Mega Y)
  console.log('\n\n🔥 Ejemplo: Charizard (species_id = 6)');
  
  // Ver todos los Pokemon relacionados con Charizard
  const charizardForms = await client.query(`
    SELECT 
      p.id,
      p.name,
      p.is_default,
      ps.id as species_id,
      ps.name as species_name,
      pf.id as form_id,
      pf.name as form_name,
      pf.form_order,
      pf.is_mega,
      pf.is_battle_only
    FROM pokemon_v2_pokemon p
    JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
    LEFT JOIN pokemon_v2_pokemonform pf ON p.id = pf.pokemon_id
    WHERE ps.id = 6
    ORDER BY p.id
  `);
  
  console.log('\nFormas de Charizard:');
  console.log(JSON.stringify(charizardForms.rows, null, 2));
  
  // Ver estructura de pokemon_v2_pokemonform
  console.log('\n\n📊 Estructura de pokemon_v2_pokemonform:');
  const formColumns = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'pokemon_v2_pokemonform'
    ORDER BY ordinal_position
  `);
  
  formColumns.rows.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type}`);
  });
  
  // Buscar todas las mega evoluciones
  console.log('\n\n💎 Todas las Mega Evoluciones en la base de datos:');
  const megaEvolutions = await client.query(`
    SELECT 
      ps.id as species_id,
      ps.name as species_name,
      p.id as pokemon_id,
      p.name as pokemon_name,
      pf.name as form_name,
      pf.is_mega
    FROM pokemon_v2_pokemonform pf
    JOIN pokemon_v2_pokemon p ON pf.pokemon_id = p.id
    JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
    WHERE pf.is_mega = true
    ORDER BY ps.id
    LIMIT 10
  `);
  
  console.log(`\nPrimeras 10 mega evoluciones:`);
  console.log(JSON.stringify(megaEvolutions.rows, null, 2));
  
  console.log(`\n\nTotal de mega evoluciones: ${megaEvolutions.rowCount}`);
  
  await client.end();
}

investigateMegaEvolutions().catch(console.error);
