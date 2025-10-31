const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

async function checkEvolutionData() {
  console.log('\n=== Verificando datos de evolución ===\n');
  
  const db = new PostgresDatabase();
  
  try {
    await db.connect();
    
    // Verificar estructura de evolution chain
    const evolutionChainColumns = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pokemon_v2_evolutionchain'
      ORDER BY ordinal_position;
    `;
    
    const chainColumns = await db.all(evolutionChainColumns);
    console.log('📊 Columnas de pokemon_v2_evolutionchain:');
    console.table(chainColumns);
    
    // Buscar tablas de evolución
    const evolutionTables = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%evolution%'
      ORDER BY table_name;
    `;
    
    const tables = await db.all(evolutionTables);
    console.log('\n🔄 Tablas de evolución:');
    console.table(tables);
    
    // Verificar pokemon_v2_pokemonevolution
    const evolutionDetailsColumns = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pokemon_v2_pokemonevolution'
      ORDER BY ordinal_position;
    `;
    
    const detailsColumns = await db.all(evolutionDetailsColumns);
    console.log('\n📋 Columnas de pokemon_v2_pokemonevolution:');
    console.table(detailsColumns);
    
    // Datos de evolución de Pikachu
    const pikachuEvolution = `
      SELECT 
        pe.*,
        et.name as trigger_name,
        i.name as item_name,
        ps_to.name as evolves_to_species,
        ps_from.name as evolves_from_species
      FROM pokemon_v2_pokemonevolution pe
      LEFT JOIN pokemon_v2_evolutiontrigger et ON pe.evolution_trigger_id = et.id
      LEFT JOIN pokemon_v2_item i ON pe.evolution_item_id = i.id
      LEFT JOIN pokemon_v2_pokemonspecies ps_to ON pe.evolved_species_id = ps_to.id
      LEFT JOIN pokemon_v2_pokemonspecies ps_from ON pe.id = ps_from.id
      WHERE pe.evolved_species_id = 25 OR pe.id IN (
        SELECT id FROM pokemon_v2_pokemonspecies WHERE evolution_chain_id = (
          SELECT evolution_chain_id FROM pokemon_v2_pokemonspecies WHERE id = 25
        )
      )
      ORDER BY pe.id;
    `;
    
    const evolutionData = await db.all(pikachuEvolution);
    console.log('\n⚡ Datos de evolución de la cadena de Pikachu:');
    console.table(evolutionData);
    
    // Verificar género
    const genderData = `
      SELECT 
        id,
        name,
        gender_rate,
        CASE 
          WHEN gender_rate = -1 THEN 'Sin género'
          WHEN gender_rate = 0 THEN '100% Macho'
          WHEN gender_rate = 8 THEN '100% Hembra'
          ELSE CONCAT(ROUND((gender_rate / 8.0) * 100, 1), '% Hembra, ', ROUND((1 - gender_rate / 8.0) * 100, 1), '% Macho')
        END as gender_distribution
      FROM pokemon_v2_pokemonspecies
      WHERE id = 25;
    `;
    
    const gender = await db.get(genderData);
    console.log('\n⚧️ Distribución de género de Pikachu:');
    console.log(JSON.stringify(gender, null, 2));
    
    // Verificar color, hábitat y forma
    const colorHabitatShape = `
      SELECT 
        ps.name as pokemon,
        pc.name as color,
        ph.name as habitat,
        psh.name as shape
      FROM pokemon_v2_pokemonspecies ps
      LEFT JOIN pokemon_v2_pokemoncolor pc ON ps.pokemon_color_id = pc.id
      LEFT JOIN pokemon_v2_pokemonhabitat ph ON ps.pokemon_habitat_id = ph.id
      LEFT JOIN pokemon_v2_pokemonshape psh ON ps.pokemon_shape_id = psh.id
      WHERE ps.id = 25;
    `;
    
    const appearance = await db.get(colorHabitatShape);
    console.log('\n🎨 Apariencia y hábitat de Pikachu:');
    console.log(JSON.stringify(appearance, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

checkEvolutionData();
