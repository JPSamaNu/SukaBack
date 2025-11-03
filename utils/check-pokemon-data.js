const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

async function checkPokemonData() {
  console.log('\n=== Verificando datos disponibles de Pokémon ===\n');
  
  const db = new PostgresDatabase();
  
  try {
    await db.connect();
    
    // Verificar estructura de pokemon_v2_pokemonspecies (datos de especies)
    const speciesColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pokemon_v2_pokemonspecies'
      ORDER BY ordinal_position;
    `;
    
    const speciesColumns = await db.all(speciesColumnsQuery);
    console.log('📊 Columnas disponibles en pokemon_v2_pokemonspecies:');
    console.table(speciesColumns);
    
    // Obtener datos de ejemplo de un Pokémon (Pikachu - #25)
    const pikachuQuery = `
      SELECT *
      FROM pokemon_v2_pokemonspecies
      WHERE id = 25;
    `;
    
    const pikachuData = await db.get(pikachuQuery);
    console.log('\n⚡ Datos completos de Pikachu (especies):');
    console.log(JSON.stringify(pikachuData, null, 2));
    
    // Verificar tablas relacionadas con huevos
    const eggTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%egg%'
      ORDER BY table_name;
    `;
    
    const eggTables = await db.all(eggTablesQuery);
    console.log('\n🥚 Tablas relacionadas con huevos:');
    console.table(eggTables);
    
    // Verificar grupos de huevo de Pikachu
    const eggGroupQuery = `
      SELECT 
        peg.pokemon_species_id,
        eg.id as egg_group_id,
        eg.name as egg_group_name
      FROM pokemon_v2_pokemonegggroup peg
      JOIN pokemon_v2_egggroup eg ON peg.egg_group_id = eg.id
      WHERE peg.pokemon_species_id = 25;
    `;
    
    const eggGroupData = await db.all(eggGroupQuery);
    console.log('\n🥚 Grupos de huevo de Pikachu:');
    console.table(eggGroupData);
    
    // Verificar estadísticas base
    const statsQuery = `
      SELECT 
        ps.id,
        ps.pokemon_id,
        ps.stat_id,
        s.name as stat_name,
        ps.base_stat,
        ps.effort
      FROM pokemon_v2_pokemonstat ps
      JOIN pokemon_v2_stat s ON ps.stat_id = s.id
      WHERE ps.pokemon_id = 25
      ORDER BY ps.stat_id;
    `;
    
    const statsData = await db.all(statsQuery);
    console.log('\n📊 Estadísticas base de Pikachu:');
    console.table(statsData);
    
    // Verificar datos de captura y breeding
    const breedingQuery = `
      SELECT 
        id,
        name,
        capture_rate,
        base_happiness,
        is_baby,
        hatch_counter,
        has_gender_differences,
        growth_rate_id,
        forms_switchable,
        is_legendary,
        is_mythical
      FROM pokemon_v2_pokemonspecies
      WHERE id = 25;
    `;
    
    const breedingData = await db.get(breedingQuery);
    console.log('\n🎯 Datos de captura y reproducción de Pikachu:');
    console.log(JSON.stringify(breedingData, null, 2));
    
    // Verificar tablas de growth rate
    const growthRateQuery = `
      SELECT id, name
      FROM pokemon_v2_growthrate
      ORDER BY id;
    `;
    
    const growthRates = await db.all(growthRateQuery);
    console.log('\n📈 Growth Rates disponibles:');
    console.table(growthRates);
    
    // Verificar habilidades del Pokémon
    const abilitiesQuery = `
      SELECT 
        pa.pokemon_id,
        pa.ability_id,
        a.name as ability_name,
        pa.is_hidden,
        pa.slot
      FROM pokemon_v2_pokemonability pa
      JOIN pokemon_v2_ability a ON pa.ability_id = a.id
      WHERE pa.pokemon_id = 25
      ORDER BY pa.slot;
    `;
    
    const abilitiesData = await db.all(abilitiesQuery);
    console.log('\n⚡ Habilidades de Pikachu:');
    console.table(abilitiesData);
    
    // Verificar formas del Pokémon
    const formsQuery = `
      SELECT 
        id,
        name,
        form_name,
        pokemon_id,
        is_default,
        is_battle_only,
        is_mega,
        form_order
      FROM pokemon_v2_pokemonform
      WHERE pokemon_id = 25;
    `;
    
    const formsData = await db.all(formsQuery);
    console.log('\n🎭 Formas de Pikachu:');
    console.table(formsData);
    
    // Verificar evoluciones
    const evolutionQuery = `
      SELECT 
        ec.id,
        ec.evolved_species_id,
        ps1.name as evolves_from,
        ps2.name as evolves_to,
        ec.evolution_trigger_id,
        et.name as trigger_name,
        ec.min_level,
        ec.min_happiness,
        ec.min_beauty,
        ec.min_affection
      FROM pokemon_v2_evolutionchain ec
      JOIN pokemon_v2_pokemonspecies ps1 ON ec.id = ps1.evolution_chain_id AND ps1.id = ec.baby_trigger_item_id
      JOIN pokemon_v2_pokemonspecies ps2 ON ec.evolved_species_id = ps2.id
      LEFT JOIN pokemon_v2_evolutiontrigger et ON ec.evolution_trigger_id = et.id
      WHERE ec.id = (SELECT evolution_chain_id FROM pokemon_v2_pokemonspecies WHERE id = 25)
      LIMIT 5;
    `;
    
    try {
      const evolutionData = await db.all(evolutionQuery);
      console.log('\n🔄 Datos de evolución (cadena de Pikachu):');
      console.table(evolutionData);
    } catch (e) {
      console.log('\n🔄 Evolución: Query necesita ajuste, pero los datos existen');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

checkPokemonData();
