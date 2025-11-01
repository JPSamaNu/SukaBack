const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

async function checkZAGame() {
  console.log('\n=== Buscando información de Pokémon Legends Z-A ===\n');
  
  const db = new PostgresDatabase();
  
  try {
    await db.connect();
    
    // Primero, verificar estructura de la tabla pokemon_v2_version
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pokemon_v2_version'
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await db.all(columnsQuery);
    console.log('Columnas de pokemon_v2_version:');
    console.table(columnsResult);
    
    // Verificar estructura de pokemon_v2_versiongroup
    const vgColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pokemon_v2_versiongroup'
      ORDER BY ordinal_position;
    `;
    
    const vgColumnsResult = await db.all(vgColumnsQuery);
    console.log('\nColumnas de pokemon_v2_versiongroup:');
    console.table(vgColumnsResult);
    
    // Buscar versiones con 'legend' o 'z' (usando name en lugar de identifier)
    const versionsQuery = `
      SELECT id, name, version_group_id 
      FROM pokemon_v2_version 
      WHERE name LIKE '%legend%' OR name LIKE '%z%'
      ORDER BY id DESC
      LIMIT 20;
    `;
    
    const versionsResult = await db.all(versionsQuery);
    console.log('\nVersiones encontradas con "legend" o "z":');
    console.table(versionsResult);
    
    // Buscar todos los version groups recientes
    const versionGroupsQuery = `
      SELECT vg.id, vg.name, vg.generation_id, g.name as generation_name
      FROM pokemon_v2_versiongroup vg
      LEFT JOIN pokemon_v2_generation g ON vg.generation_id = g.id
      ORDER BY vg.id DESC
      LIMIT 20;
    `;
    
    const versionGroupsResult = await db.all(versionGroupsQuery);
    console.log('\nVersion Groups más recientes:');
    console.table(versionGroupsResult);
    
    // Buscar versiones más recientes
    const recentVersionsQuery = `
      SELECT v.id, v.name, v.version_group_id, vg.name as version_group_name
      FROM pokemon_v2_version v
      LEFT JOIN pokemon_v2_versiongroup vg ON v.version_group_id = vg.id
      ORDER BY v.id DESC
      LIMIT 15;
    `;
    
    const recentVersionsResult = await db.all(recentVersionsQuery);
    console.log('\nVersiones más recientes:');
    console.table(recentVersionsResult);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

checkZAGame();
