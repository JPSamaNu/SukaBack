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

async function testAllLocations() {
  try {
    console.log('\n🔍 Probando query de ubicaciones de TODOS los Pokémon...\n');
    
    const startTime = Date.now();
    
    const query = `
      SELECT 
        e.pokemon_id,
        p.name as pokemon_name,
        COUNT(e.id) as total_encounters,
        COUNT(DISTINCT v.id) as total_versions,
        json_agg(
          jsonb_build_object(
            'version', v.name,
            'version_id', v.id,
            'version_group', vg.name,
            'version_group_id', vg.id,
            'generation', g.name,
            'location', l.name,
            'location_id', l.id,
            'location_area', la.name,
            'min_level', e.min_level,
            'max_level', e.max_level,
            'encounter_method', em.name,
            'encounter_method_id', em.id,
            'rarity', es.rarity
          )
        ) as encounters
      FROM pokemon_v2_encounter e
      LEFT JOIN pokemon_v2_pokemon p ON e.pokemon_id = p.id
      LEFT JOIN pokemon_v2_locationarea la ON e.location_area_id = la.id
      LEFT JOIN pokemon_v2_location l ON la.location_id = l.id
      LEFT JOIN pokemon_v2_encounterslot es ON e.encounter_slot_id = es.id
      LEFT JOIN pokemon_v2_encountermethod em ON es.encounter_method_id = em.id
      LEFT JOIN pokemon_v2_version v ON e.version_id = v.id
      LEFT JOIN pokemon_v2_versiongroup vg ON v.version_group_id = vg.id
      LEFT JOIN pokemon_v2_generation g ON vg.generation_id = g.id
      WHERE p.is_default = true
      GROUP BY e.pokemon_id, p.name
      ORDER BY e.pokemon_id
      LIMIT 5
    `;

    const result = await pool.query(query);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Query ejecutada en ${duration}ms\n`);
    console.log(`📊 Total de Pokémon con ubicaciones: ${result.rows.length}\n`);

    // Mostrar primeros 5 resultados
    result.rows.forEach(pokemon => {
      console.log(`\n🔹 Pokémon #${pokemon.pokemon_id}: ${pokemon.pokemon_name}`);
      console.log(`   Total encuentros: ${pokemon.total_encounters}`);
      console.log(`   Total versiones: ${pokemon.total_versions}`);
      console.log(`   Datos de encuentros: ${pokemon.encounters.length} registros`);
      
      // Mostrar primer encuentro como ejemplo
      if (pokemon.encounters && pokemon.encounters.length > 0) {
        const firstEncounter = pokemon.encounters[0];
        console.log(`   Ejemplo: ${firstEncounter.location} (${firstEncounter.version}) - Nivel ${firstEncounter.min_level}-${firstEncounter.max_level}`);
      }
    });

    console.log('\n\n📈 Estadísticas:');
    console.log(`   - Pokémon procesados: ${result.rows.length}`);
    console.log(`   - Tiempo de ejecución: ${duration}ms`);
    console.log(`   - Promedio por Pokémon: ${(duration / result.rows.length).toFixed(2)}ms`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testAllLocations();
