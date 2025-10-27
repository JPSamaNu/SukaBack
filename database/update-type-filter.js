const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// CONFIGURACIÓN DE LA BASE DE DATOS
// Edita estos valores según tu configuración local o usa variables de entorno
const DB_CONFIG = {
  user: process.env.DB_USERNAME || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pokeapi_db',
  password: process.env.DB_PASSWORD || 'TU_CONTRASEÑA_AQUÍ',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

console.log('� Configuración de conexión:');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Puerto: ${DB_CONFIG.port}`);
console.log(`   Usuario: ${DB_CONFIG.user}`);
console.log(`   Base de datos: ${DB_CONFIG.database}`);
console.log(`   Password: ${DB_CONFIG.password === 'TU_CONTRASEÑA_AQUÍ' ? '❌ NO CONFIGURADA' : '✓'}\n`);

if (DB_CONFIG.password === 'TU_CONTRASEÑA_AQUÍ') {
  console.error('❌ ERROR: Debes configurar la contraseña de la base de datos');
  console.log('\n💡 Opciones:');
  console.log('   1. Edita el archivo update-type-filter.js línea 12');
  console.log('   2. Usa variables de entorno: DB_PASSWORD=tu_password node update-type-filter.js');
  console.log('   3. Copia manualmente el SQL de add-type-filter.sql a pgAdmin\n');
  process.exit(1);
}

async function updateStoredProcedure() {
  const pool = new Pool(DB_CONFIG);

  try {
    console.log('🔄 Conectando a la base de datos...');
    const client = await pool.connect();
    
    console.log('📄 Leyendo script SQL...');
    const sqlPath = path.join(__dirname, 'add-type-filter.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('⚡ Ejecutando actualización del stored procedure...');
    await client.query(sql);
    
    console.log('✅ Stored procedure actualizado correctamente!');
    
    // Verificar que la función se actualizó
    const result = await client.query(`
      SELECT 
        proname as function_name,
        pronargs as num_arguments
      FROM pg_proc 
      WHERE proname = 'get_pokemon_paginated'
    `);
    
    if (result.rows.length > 0) {
      console.log('\n✓ Función encontrada:');
      console.log(`  - Nombre: ${result.rows[0].function_name}`);
      console.log(`  - Número de argumentos: ${result.rows[0].num_arguments}`);
      
      if (result.rows[0].num_arguments === 7) {
        console.log('\n🎉 El filtro por tipo ha sido agregado exitosamente!');
        console.log('   Ahora la función acepta 7 parámetros (incluyendo p_type)');
      } else {
        console.log('\n⚠️  Advertencia: La función debería tener 7 argumentos pero tiene', result.rows[0].num_arguments);
      }
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error al actualizar el stored procedure:', error.message);
    process.exit(1);
  }
}

updateStoredProcedure();
