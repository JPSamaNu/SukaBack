const { Client } = require('pg');

const client = new Client({
  host: 'sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'sukadb',
  user: 'suka',
  password: 'SukaBliat123',
  ssl: { rejectUnauthorized: false }
});

async function investigateEvolutionStructure() {
  await client.connect();
  
  console.log('🔍 Investigando estructura de evoluciones de Charmander (chain_id=2)\n');
  
  // Ver todos los Pokemon de la cadena
  const species = await client.query(`
    SELECT id, name 
    FROM pokemon_v2_pokemonspecies 
    WHERE evolution_chain_id = 2 
    ORDER BY id
  `);
  
  console.log('Pokemon en la cadena:');
  console.log(JSON.stringify(species.rows, null, 2));
  
  // Ver todas las evoluciones
  const evolutions = await client.query(`
    SELECT 
      pe.id as evo_id,
      pe.evolved_species_id,
      ps.name as evolved_to_name,
      pe.min_level
    FROM pokemon_v2_pokemonevolution pe
    JOIN pokemon_v2_pokemonspecies ps ON pe.evolved_species_id = ps.id
    WHERE ps.evolution_chain_id = 2
    ORDER BY pe.evolved_species_id
  `);
  
  console.log('\nEvoluciones registradas:');
  console.log(JSON.stringify(evolutions.rows, null, 2));
  
  // La clave: NO HAY from_species_id, solo evolved_species_id
  // Entonces: id=3 (charmeleon) evolved_species_id=5 significa "algo" evoluciona a Charmeleon(5)
  // Y id=4 (charizard) evolved_species_id=6 significa "algo" evoluciona a Charizard(6)
  
  // Para saber QUÉ evoluciona, necesito mirar el orden de IDs
  // Charmander (4) → Charmeleon (5) → Charizard (6)
  // Entonces el patrón es: el anterior en la lista es el "from"
  
  console.log('\n💡 Interpretación:');
  evolutions.rows.forEach(evo => {
    const target = species.rows.find(s => s.id === evo.evolved_species_id);
    const source = species.rows.find(s => s.id < evo.evolved_species_id);
    const previousInChain = species.rows.filter(s => s.id < evo.evolved_species_id).pop();
    
    console.log(`\n  Evolución #${evo.evo_id}:`);
    console.log(`    evolved_species_id: ${evo.evolved_species_id} (${evo.evolved_to_name})`);
    console.log(`    El anterior en la cadena: ${previousInChain?.id} (${previousInChain?.name})`);
    console.log(`    → Interpretación: ${previousInChain?.name} evoluciona a ${evo.evolved_to_name} en nivel ${evo.min_level}`);
  });
  
  await client.end();
}

investigateEvolutionStructure().catch(console.error);
