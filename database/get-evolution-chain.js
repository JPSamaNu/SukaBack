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

async function getEvolutionChain() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Query completa para obtener la cadena de evolución de un Pokemon
    console.log('🔍 Cadena de evolución de Bulbasaur (id=1):');
    const result = await client.query(`
      WITH RECURSIVE evolution_chain AS (
        -- Pokemon base (sin pre-evolución)
        SELECT 
          ps.id,
          ps.name,
          ps.evolution_chain_id,
          NULL::integer as evolves_from_id,
          0 as level
        FROM pokemon_v2_pokemonspecies ps
        WHERE ps.id = 1
        
        UNION ALL
        
        -- Evoluciones
        SELECT 
          ps.id,
          ps.name,
          ps.evolution_chain_id,
          ec.id as evolves_from_id,
          ec.level + 1
        FROM evolution_chain ec
        JOIN pokemon_v2_pokemonevolution pe ON ec.id = (
          SELECT ps2.id 
          FROM pokemon_v2_pokemonspecies ps2 
          WHERE ps2.id = pe.evolved_species_id - 1
          LIMIT 1
        )
        JOIN pokemon_v2_pokemonspecies ps ON pe.evolved_species_id = ps.id
        WHERE ec.level < 10
      )
      SELECT * FROM evolution_chain ORDER BY level;
    `);
    console.log(JSON.stringify(result.rows, null, 2));

    // Método más simple: buscar todas las evoluciones de la cadena
    console.log('\n🔍 Método simple - Todas las especies de la cadena 1:');
    const chain = await client.query(`
      SELECT 
        ps.id,
        ps.name,
        ps.evolution_chain_id
      FROM pokemon_v2_pokemonspecies ps
      WHERE ps.evolution_chain_id = 1
      ORDER BY ps.id
    `);
    console.log(JSON.stringify(chain.rows, null, 2));

    console.log('\n🔍 Evoluciones de la cadena 1:');
    const evolutions = await client.query(`
      SELECT 
        pe.id,
        pe.evolved_species_id,
        ps.name as evolved_to,
        pe.min_level,
        pe.evolution_item_id,
        pe.min_happiness,
        pet.name as trigger,
        pe.time_of_day
      FROM pokemon_v2_pokemonevolution pe
      JOIN pokemon_v2_pokemonspecies ps ON pe.evolved_species_id = ps.id
      LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
      WHERE ps.evolution_chain_id = 1
      ORDER BY pe.id
    `);
    console.log(JSON.stringify(evolutions.rows, null, 2));

    // Ver la evolución de Pikachu
    console.log('\n🔍 Pikachu (id=25) - evolution_chain_id:');
    const pikachu = await client.query(`
      SELECT id, name, evolution_chain_id 
      FROM pokemon_v2_pokemonspecies 
      WHERE id = 25
    `);
    console.log(JSON.stringify(pikachu.rows, null, 2));

    if (pikachu.rows.length > 0) {
      const chain_id = pikachu.rows[0].evolution_chain_id;
      console.log(`\n🔍 Toda la cadena de Pikachu (chain_id=${chain_id}):`);
      const pikachu_chain = await client.query(`
        SELECT 
          ps.id,
          ps.name,
          pe.evolved_species_id,
          pe.min_level,
          pe.evolution_item_id,
          pet.name as trigger
        FROM pokemon_v2_pokemonspecies ps
        LEFT JOIN pokemon_v2_pokemonevolution pe ON ps.id = (
          SELECT ps2.id 
          FROM pokemon_v2_pokemonspecies ps2 
          WHERE pe.evolved_species_id = ps2.id 
          AND ps2.evolution_chain_id = $1
          LIMIT 1
        )
        LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
        WHERE ps.evolution_chain_id = $1
        ORDER BY ps.id
      `, [chain_id]);
      console.log(JSON.stringify(pikachu_chain.rows, null, 2));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

getEvolutionChain();
