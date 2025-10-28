const axios = require('axios');

async function testBerriesEndpoint() {
  try {
    console.log('🧪 Probando endpoint de berries...\n');
    
    const response = await axios.get('http://localhost:2727/api/v1/berries', {
      params: {
        page: 1,
        limit: 20
      }
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error en la petición:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('\nMensaje:', error.message);
  }
}

testBerriesEndpoint();
