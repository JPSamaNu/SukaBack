const { Pool } = require('pg');

const pool = new Pool({
  host: 'sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'sukadb',
  user: 'suka',
  password: 'SukaBliat123',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkLocations() {
  try {
    // Buscar tablas relacionadas con ubicaciones
    console.log('\n=== TABLAS DE UBICACIONES ===\n');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%location%' OR table_name LIKE '%encounter%')
      ORDER BY table_name
    `);
    
    tables.rows.forEach(r => console.log('  -', r.table_name));

    // Ver estructura de pokemon_v2_encounter
    console.log('\n=== ESTRUCTURA DE pokemon_v2_encounter ===\n');
    const encounterStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pokemon_v2_encounter'
      ORDER BY ordinal_position
    `);
    
    encounterStructure.rows.forEach(r => {
      console.log(`  ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Ver estructura de location_area
    console.log('\n=== ESTRUCTURA DE pokemon_v2_locationarea ===\n');
    const locationAreaStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pokemon_v2_locationarea'
      ORDER BY ordinal_position
    `);
    
    locationAreaStructure.rows.forEach(r => {
      console.log(`  ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Ver datos de ejemplo para un Pokémon (Bulbasaur = 1)
    console.log('\n=== ENCUENTROS DE BULBASAUR (ID=1) ===\n');
    const encounterData = await pool.query(`
      SELECT 
        e.id,
        e.min_level,
        e.max_level,
        e.pokemon_id,
        la.name as location_area,
        l.name as location,
        v.name as version,
        em.name as encounter_method,
        es.rarity,
        vg.name as version_group
      FROM pokemon_v2_encounter e
      LEFT JOIN pokemon_v2_locationarea la ON e.location_area_id = la.id
      LEFT JOIN pokemon_v2_location l ON la.location_id = l.id
      LEFT JOIN pokemon_v2_encounterslot es ON e.encounter_slot_id = es.id
      LEFT JOIN pokemon_v2_encountermethod em ON es.encounter_method_id = em.id
      LEFT JOIN pokemon_v2_version v ON e.version_id = v.id
      LEFT JOIN pokemon_v2_versiongroup vg ON v.version_group_id = vg.id
      WHERE e.pokemon_id = 1
      ORDER BY v.id, l.id
      LIMIT 20
    `);

    console.log('Total de encuentros encontrados:', encounterData.rows.length);
    encounterData.rows.forEach(r => {
      console.log(`\n  📍 ${r.location || 'Unknown'} - ${r.location_area || 'Unknown'}`);
      console.log(`     Nivel: ${r.min_level}-${r.max_level}`);
      console.log(`     Juego: ${r.version} (${r.version_group})`);
      console.log(`     Método: ${r.encounter_method} (rareza: ${r.rarity}%)`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkLocations();
