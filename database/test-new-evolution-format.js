const http = require('http');

function testEvolution(pokemonId, name) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:2727/api/v1/pokemon/${pokemonId}/evolution`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`\n${'='.repeat(70)}`);
          console.log(`Test: ${name} (id=${pokemonId})`);
          console.log('='.repeat(70));
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runTests() {
  console.log('🧪 Probando NUEVO FORMATO de evolución (cadena completa)\n');
  
  try {
    // Test con Charizard (debería mostrar Charmander → Charmeleon → Charizard)
    await testEvolution(6, 'Charizard');
    
    // Test con Charmander (debería mostrar la misma cadena)
    await testEvolution(4, 'Charmander');
    
    // Test con Charmeleon (debería mostrar la misma cadena)
    await testEvolution(5, 'Charmeleon');
    
    console.log('\n✅ Todos los tests completados');
  } catch (err) {
    console.error('\n❌ Error en los tests:', err);
  }
}

runTests();
