const http = require('http');

async function testEvolutionEndpoint(pokemonId) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:2727/api/v1/pokemon/${pokemonId}/evolution`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🧪 Probando endpoint de evolución\n');
  
  // Test 1: Bulbasaur (id=1) - no tiene pre-evolución
  console.log('Test 1: Bulbasaur (id=1)');
  const bulbasaur = await testEvolutionEndpoint(1);
  console.log(JSON.stringify(bulbasaur, null, 2));
  
  // Test 2: Ivysaur (id=2) - tiene pre y post evolución
  console.log('\nTest 2: Ivysaur (id=2)');
  const ivysaur = await testEvolutionEndpoint(2);
  console.log(JSON.stringify(ivysaur, null, 2));
  
  // Test 3: Venusaur (id=3) - solo tiene pre-evolución
  console.log('\nTest 3: Venusaur (id=3)');
  const venusaur = await testEvolutionEndpoint(3);
  console.log(JSON.stringify(venusaur, null, 2));
  
  // Test 4: Pikachu (id=25)
  console.log('\nTest 4: Pikachu (id=25)');
  const pikachu = await testEvolutionEndpoint(25);
  console.log(JSON.stringify(pikachu, null, 2));
  
  // Test 5: Eevee (id=133) - tiene múltiples evoluciones
  console.log('\nTest 5: Eevee (id=133)');
  const eevee = await testEvolutionEndpoint(133);
  console.log(JSON.stringify(eevee, null, 2));
}

main().catch(console.error);
