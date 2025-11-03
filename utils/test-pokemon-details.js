const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

async function testPokemonData() {
  console.log('\n=== Probando datos de Pokémon (Pikachu #25) ===\n');
  
  const db = new PostgresDatabase();
  
  try {
    await db.connect();
    
    const pokemonId = 25; // Pikachu
    
    // Probar movimientos
    const movesQuery = `
      SELECT DISTINCT ON (m.id, pm.level)
        pm.level,
        m.name,
        t.name as type,
        m.power,
        m.accuracy,
        m.pp,
        dc.name as "damageClass"
      FROM pokemon_v2_pokemonmove pm
      INNER JOIN pokemon_v2_move m ON pm.move_id = m.id
      INNER JOIN pokemon_v2_type t ON m.type_id = t.id
      INNER JOIN pokemon_v2_movedamageclass dc ON m.move_damage_class_id = dc.id
      INNER JOIN pokemon_v2_movelearnmethod mlm ON pm.move_learn_method_id = mlm.id
      WHERE pm.pokemon_id = $1 
        AND mlm.name = 'level-up'
        AND pm.level IS NOT NULL
      ORDER BY m.id, pm.level, pm.level ASC, m.name
      LIMIT 10;
    `;
    
    const moves = await db.all(movesQuery, [pokemonId]);
    console.log('🎯 Movimientos por nivel (primeros 10):');
    console.table(moves);
    
    // Probar clasificación
    const speciesQuery = `
      SELECT 
        ps.id,
        ps.is_legendary as "isLegendary",
        ps.is_mythical as "isMythical",
        ps.is_baby as "isBaby",
        ps.capture_rate as "captureRate",
        ps.base_happiness as "baseHappiness",
        ps.hatch_counter as "hatchCounter",
        ps.gender_rate as "genderRate",
        gr.name as "growthRate",
        ph.name as habitat,
        pc.name as color,
        psh.name as shape
      FROM pokemon_v2_pokemonspecies ps
      LEFT JOIN pokemon_v2_growthrate gr ON ps.growth_rate_id = gr.id
      LEFT JOIN pokemon_v2_pokemonhabitat ph ON ps.pokemon_habitat_id = ph.id
      LEFT JOIN pokemon_v2_pokemoncolor pc ON ps.pokemon_color_id = pc.id
      LEFT JOIN pokemon_v2_pokemonshape psh ON ps.pokemon_shape_id = psh.id
      WHERE ps.id = $1
    `;
    
    const [classification] = await db.all(speciesQuery, [pokemonId]);
    console.log('\n🏆 Clasificación:');
    console.log(JSON.stringify(classification, null, 2));
    
    // Grupos de huevo
    const eggGroupsQuery = `
      SELECT eg.name
      FROM pokemon_v2_pokemonegggroup peg
      INNER JOIN pokemon_v2_egggroup eg ON peg.egg_group_id = eg.id
      WHERE peg.pokemon_species_id = $1
    `;
    
    const eggGroups = await db.all(eggGroupsQuery, [pokemonId]);
    console.log('\n🥚 Grupos de huevo:');
    console.table(eggGroups);
    
    // Probar stats con effort
    const statsQuery = `
      SELECT 
        s.name,
        ps.base_stat as "baseStat",
        ps.effort
      FROM pokemon_v2_pokemonstat ps
      INNER JOIN pokemon_v2_stat s ON ps.stat_id = s.id
      WHERE ps.pokemon_id = $1
      ORDER BY s.id
    `;
    
    const stats = await db.all(statsQuery, [pokemonId]);
    console.log('\n📊 Stats con EVs:');
    console.table(stats);
    
    const statsWithEffort = stats.filter(s => s.effort > 0);
    console.log(`\n✨ Stats que otorgan EVs: ${statsWithEffort.length}`);
    console.table(statsWithEffort);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.close();
  }
}

testPokemonData();
