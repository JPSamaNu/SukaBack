const axios = require('axios');

async function testPokemonForms() {
  console.log('🧪 Probando endpoint de formas de Pokemon\n');
  
  const testCases = [
    { id: 6, name: 'Charizard (Mega X, Mega Y, Gmax)' },
    { id: 3, name: 'Venusaur (Mega)' },
    { id: 150, name: 'Mewtwo (Mega X, Mega Y)' },
  ];

  for (const testCase of testCases) {
    console.log('======================================================================');
    console.log(`Test: ${testCase.name} (id=${testCase.id})`);
    console.log('======================================================================');
    
    try {
      const response = await axios.get(`http://localhost:3001/pokemon/${testCase.id}/forms`);
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }
    
    console.log('\n');
  }
  
  console.log('✅ Todos los tests completados');
}

testPokemonForms().catch(console.error);
