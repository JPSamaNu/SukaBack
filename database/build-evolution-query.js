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

async function buildEvolutionQuery() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Para un Pokemon específico (ej: Bulbasaur id=1), obtener:
    // 1. Su pre-evolución (si existe)
    // 2. Sus evoluciones
    
    const pokemonId = 1; // Bulbasaur
    
    console.log(`🔍 Evoluciones COMPLETAS para Pokemon ID ${pokemonId}:\n`);
    
    // Primero obtener el evolution_chain_id
    const chainResult = await client.query(`
      SELECT evolution_chain_id FROM pokemon_v2_pokemonspecies WHERE id = $1
    `, [pokemonId]);
    
    if (chainResult.rows.length === 0) {
      console.log('Pokemon not found');
      return;
    }
    
    const chainId = chainResult.rows[0].evolution_chain_id;
    console.log(`Evolution Chain ID: ${chainId}\n`);
    
    // Obtener TODAS las especies de esta cadena con sus evoluciones
    const fullChain = await client.query(`
      SELECT 
        ps.id as species_id,
        ps.name as species_name,
        pe_from.evolved_species_id,
        pe_from.min_level as evolves_at_level,
        pe_from.evolution_item_id,
        pe_from.min_happiness,
        pe_from.min_affection,
        pe_from.time_of_day,
        pet_from.name as evolution_trigger,
        pi.name as evolution_item_name
      FROM pokemon_v2_pokemonspecies ps
      -- Evoluciones HACIA adelante (este Pokemon evoluciona a...)
      LEFT JOIN pokemon_v2_pokemonevolution pe_from ON (
        -- Necesitamos encontrar el registro donde este Pokemon es el "from"
        -- pero pe solo tiene "evolved_species_id", no "from_species_id"
        -- La lógica es: si evolved_species_id - 1 = ps.id (para cadenas lineales)
        -- O mejor: buscar por evolution_chain_id y orden
        pe_from.id = (
          SELECT pe2.id 
          FROM pokemon_v2_pokemonevolution pe2
          JOIN pokemon_v2_pokemonspecies ps2 ON pe2.evolved_species_id = ps2.id
          WHERE ps2.evolution_chain_id = $1
            AND pe2.evolved_species_id > ps.id
          ORDER BY pe2.evolved_species_id
          LIMIT 1
        )
      )
      LEFT JOIN pokemon_v2_evolutiontrigger pet_from ON pe_from.evolution_trigger_id = pet_from.id
      LEFT JOIN pokemon_v2_item pi ON pe_from.evolution_item_id = pi.id
      WHERE ps.evolution_chain_id = $1
      ORDER BY ps.id
    `, [chainId]);
    
    console.log('Full chain data:');
    console.log(JSON.stringify(fullChain.rows, null, 2));
    
    // Método mejor: query directa por evolved_species_id
    console.log('\n\n🔍 Método CORRECTO - Buscar "de dónde viene" y "hacia dónde va":\n');
    
    // 1. De dónde viene (pre-evolución)
    const preEvolution = await client.query(`
      SELECT 
        ps_from.id as pre_evo_id,
        ps_from.name as pre_evo_name,
        pe.min_level,
        pe.evolution_item_id,
        pe.min_happiness,
        pe.min_affection,
        pe.time_of_day,
        pet.name as trigger,
        pi.name as item_name
      FROM pokemon_v2_pokemonevolution pe
      JOIN pokemon_v2_pokemonspecies ps_from ON ps_from.evolution_chain_id = (
        SELECT evolution_chain_id FROM pokemon_v2_pokemonspecies WHERE id = $1
      )
      LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
      LEFT JOIN pokemon_v2_item pi ON pe.evolution_item_id = pi.id
      WHERE pe.evolved_species_id = $1
    `, [pokemonId]);
    
    console.log('PRE-EVOLUCIÓN (de dónde viene):');
    console.log(JSON.stringify(preEvolution.rows, null, 2));
    
    // 2. Hacia dónde va (evoluciones)
    const evolutions = await client.query(`
      SELECT 
        ps_to.id as evolution_id,
        ps_to.name as evolution_name,
        pe.min_level,
        pe.evolution_item_id,
        pe.min_happiness,
        pe.min_affection,
        pe.time_of_day,
        pet.name as trigger,
        pi.name as item_name
      FROM pokemon_v2_pokemonevolution pe
      JOIN pokemon_v2_pokemonspecies ps_to ON pe.evolved_species_id = ps_to.id
      JOIN pokemon_v2_pokemonspecies ps_from ON ps_from.id = $1
      LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
      LEFT JOIN pokemon_v2_item pi ON pe.evolution_item_id = pi.id
      WHERE ps_to.evolution_chain_id = ps_from.evolution_chain_id
        AND ps_to.id > $1
        AND NOT EXISTS (
          SELECT 1 FROM pokemon_v2_pokemonevolution pe2
          WHERE pe2.evolved_species_id = ps_to.id
            AND pe2.evolved_species_id != pe.evolved_species_id
        )
    `, [pokemonId]);
    
    console.log('\nEVOLUCIONES (hacia dónde va):');
    console.log(JSON.stringify(evolutions.rows, null, 2));

    // Probar con Ivysaur (id=2)
    console.log('\n\n='.repeat(60));
    console.log('🔍 Probando con Ivysaur (id=2):');
    console.log('='.repeat(60));
    
    const ivysaurPre = await client.query(`
      SELECT 
        ps_from.id,
        ps_from.name,
        pe.min_level,
        pe.evolution_item_id,
        pet.name as trigger,
        pi.name as item_name
      FROM pokemon_v2_pokemonevolution pe
      JOIN pokemon_v2_pokemonspecies ps_from ON ps_from.evolution_chain_id = (
        SELECT evolution_chain_id FROM pokemon_v2_pokemonspecies WHERE id = $1
      )
      JOIN pokemon_v2_pokemonspecies ps_check ON pe.evolved_species_id = ps_check.id
      LEFT JOIN pokemon_v2_evolutiontrigger pet ON pe.evolution_trigger_id = pet.id
      LEFT JOIN pokemon_v2_item pi ON pe.evolution_item_id = pi.id
      WHERE pe.evolved_species_id = $1
    `, [2]);
    
    console.log('\nIvysaur PRE-EVOLUCIÓN:');
    console.log(JSON.stringify(ivysaurPre.rows, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

buildEvolutionQuery();
