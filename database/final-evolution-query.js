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

async function finalEvolutionQuery() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Entendiendo la estructura:
    // pokemon_v2_pokemonevolution.evolved_species_id = el Pokemon resultante
    // Pero NO tiene from_species_id, hay que deducirlo
    
    // La clave está en pokemon_v2_pokemonspecies.evolution_chain_id
    // Todos los Pokemon de la misma cadena comparten el mismo evolution_chain_id
    
    const testPokemonId = 2; // Ivysaur
    
    console.log(`Testing with Pokemon ID: ${testPokemonId}\n`);
    
    // QUERY FINAL CORRECTA:
    // 1. Pre-evolución: buscar en evolution table donde evolved_species_id = mi ID
    const preEvo = await client.query(`
      SELECT 
        pe.evolved_species_id as to_species_id,
        pe.min_level,
        pe.evolution_item_id,
        pe.min_happiness,
        pe.min_affection,
        pe.time_of_day,
        pet.name as trigger,
        pi.name as item_name
      FROM pokemon_v2_pokemonevolution pe
      LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
      LEFT JOIN pokemon_v2_item pi ON pe.evolution_item_id = pi.id
      WHERE pe.evolved_species_id = $1
    `, [testPokemonId]);
    
    console.log('PRE-EVOLUTION DATA (raw):');
    console.log(JSON.stringify(preEvo.rows, null, 2));
    
    // Ahora necesito encontrar el "from" species_id
    // Necesito obtener todos los Pokemon de la misma cadena y ver cuál apunta a este
    const chain = await client.query(`
      SELECT evolution_chain_id FROM pokemon_v2_pokemonspecies WHERE id = $1
    `, [testPokemonId]);
    
    if (chain.rows.length > 0) {
      const chainId = chain.rows[0].evolution_chain_id;
      
      // Obtener TODOS los Pokemon de esta cadena
      const allInChain = await client.query(`
        SELECT id, name FROM pokemon_v2_pokemonspecies 
        WHERE evolution_chain_id = $1 
        ORDER BY id
      `, [chainId]);
      
      console.log(`\nAll Pokemon in chain ${chainId}:`);
      console.log(JSON.stringify(allInChain.rows, null, 2));
      
      // Ahora buscar evoluciones: cuáles tienen evolved_species_id apuntando A este Pokemon
      const evolvesFrom = await client.query(`
        SELECT 
          ps.id as from_species_id,
          ps.name as from_species_name,
          pe.evolved_species_id as to_species_id,
          ps_to.name as to_species_name,
          pe.min_level,
          pe.evolution_item_id,
          pe.min_happiness,
          pe.min_affection,
          pe.time_of_day,
          pet.name as trigger,
          pi.name as item_name
        FROM pokemon_v2_pokemonevolution pe
        JOIN pokemon_v2_pokemonspecies ps_to ON pe.evolved_species_id = ps_to.id
        JOIN pokemon_v2_pokemonspecies ps ON ps.evolution_chain_id = $1
        LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
        LEFT JOIN pokemon_v2_item pi ON pe.evolution_item_id = pi.id
        WHERE pe.evolved_species_id = $2
          AND ps.id < $2
          AND ps.id IN (
            SELECT id FROM pokemon_v2_pokemonspecies WHERE evolution_chain_id = $1
          )
        LIMIT 1
      `, [chainId, testPokemonId]);
      
      console.log(`\nEvolves FROM (pre-evolution of Pokemon ${testPokemonId}):`);
      console.log(JSON.stringify(evolvesFrom.rows, null, 2));
      
      // Y buscar evoluciones HACIA adelante: cuáles son evolved_species_id de este Pokemon
      const evolvesTo = await client.query(`
        SELECT 
          ps.id as from_species_id,
          ps.name as from_species_name,
          pe.evolved_species_id as to_species_id,
          ps_to.name as to_species_name,
          pe.min_level,
          pe.evolution_item_id,
          pe.min_happiness,
          pe.min_affection,
          pe.time_of_day,
          pet.name as trigger,
          pi.name as item_name
        FROM pokemon_v2_pokemonevolution pe
        JOIN pokemon_v2_pokemonspecies ps_to ON pe.evolved_species_id = ps_to.id
        JOIN pokemon_v2_pokemonspecies ps ON ps.id = $1
        LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
        LEFT JOIN pokemon_v2_item pi ON pe.evolution_item_id = pi.id
        WHERE ps.evolution_chain_id = ps_to.evolution_chain_id
          AND ps_to.id > $1
          AND ps_to.id IN (
            SELECT id FROM pokemon_v2_pokemonspecies WHERE evolution_chain_id = $2
          )
      `, [testPokemonId, chainId]);
      
      console.log(`\nEvolves TO (evolutions of Pokemon ${testPokemonId}):`);
      console.log(JSON.stringify(evolvesTo.rows, null, 2));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

finalEvolutionQuery();
