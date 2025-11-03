const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

async function checkZAPokedex() {
  console.log('\n=== Información detallada de Pokémon Legends Z-A ===\n');
  
  const db = new PostgresDatabase();
  
  try {
    await db.connect();
    
    // Buscar Pokédex asociados al version group de Legends Z-A
    const pokedexQuery = `
      SELECT 
        pd.id as pokedex_id,
        pd.name as pokedex_name,
        pd.is_main_series,
        pvg.version_group_id
      FROM pokemon_v2_pokedexversiongroup pvg
      JOIN pokemon_v2_pokedex pd ON pvg.pokedex_id = pd.id
      WHERE pvg.version_group_id = 30
      ORDER BY pd.id;
    `;
    
    const pokedexResult = await db.all(pokedexQuery);
    console.log('Pokédex asociados a Legends Z-A (version_group_id = 30):');
    console.table(pokedexResult);
    
    // Contar cuántos Pokémon tiene cada Pokédex
    if (pokedexResult.length > 0) {
      for (const pokedex of pokedexResult) {
        const countQuery = `
          SELECT COUNT(*) as total_pokemon
          FROM pokemon_v2_pokemondexnumber
          WHERE pokedex_id = ${pokedex.pokedex_id};
        `;
        
        const countResult = await db.get(countQuery);
        console.log(`\nPokédex "${pokedex.pokedex_name}" tiene ${countResult.total_pokemon} Pokémon`);
        
        // Mostrar los primeros 10 Pokémon de este Pokédex
        const pokemonQuery = `
          SELECT 
            pdn.pokedex_number,
            p.id as pokemon_id,
            ps.name as pokemon_name
          FROM pokemon_v2_pokemondexnumber pdn
          JOIN pokemon_v2_pokemonspecies ps ON pdn.pokemon_species_id = ps.id
          JOIN pokemon_v2_pokemon p ON ps.id = p.pokemon_species_id
          WHERE pdn.pokedex_id = ${pokedex.pokedex_id}
            AND p.is_default = true
          ORDER BY pdn.pokedex_number
          LIMIT 10;
        `;
        
        const pokemonResult = await db.all(pokemonQuery);
        console.log(`\nPrimeros 10 Pokémon del Pokédex "${pokedex.pokedex_name}":`);
        console.table(pokemonResult);
      }
    } else {
      console.log('\n⚠️  No se encontró Pokédex asociado a Legends Z-A');
      console.log('Esto es normal si el juego aún no ha sido lanzado o no tiene datos completos en PokeAPI');
    }
    
    // Verificar si hay encuentros/locations para Legends Z-A
    const encountersQuery = `
      SELECT COUNT(*) as total_encounters
      FROM pokemon_v2_encounter e
      JOIN pokemon_v2_locationarea la ON e.location_area_id = la.id
      WHERE e.version_id = 47;
    `;
    
    const encountersResult = await db.get(encountersQuery);
    console.log(`\n\nEncuentros registrados para Legends Z-A: ${encountersResult.total_encounters}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

checkZAPokedex();
