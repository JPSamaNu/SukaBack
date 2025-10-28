const axios = require('axios');

async function testEeveeEvolution() {
  console.log('🧪 Probando evolución ramificada de Eevee\n');
  
  // ID de Eevee = 133
  const eeveeId = 133;
  
  try {
    const response = await axios.get(`http://localhost:3001/pokemon/${eeveeId}/evolution-chain`);
    
    console.log('Cadena de evolución de Eevee:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testEeveeEvolution().catch(console.error);
