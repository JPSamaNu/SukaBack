const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// CONFIGURACIÓN DE LA BASE DE DATOS
const DB_CONFIG = {
  user: process.env.DB_USERNAME || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pokeapi_db',
  password: process.env.DB_PASSWORD || '',  // Déjalo vacío si no tienes contraseña, o pon tu contraseña aquí
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

console.log('🔥 Actualizando stored procedure para múltiples tipos...\n');
console.log('📝 Configuración de conexión:');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Puerto: ${DB_CONFIG.port}`);
console.log(`   Usuario: ${DB_CONFIG.user}`);
console.log(`   Base de datos: ${DB_CONFIG.database}\n`);

async function updateStoredProcedure() {
  const pool = new Pool(DB_CONFIG);

  try {
    console.log('🔄 Conectando a la base de datos...');
    const client = await pool.connect();
    
    console.log('📄 Leyendo script SQL...');
    const sqlPath = path.join(__dirname, 'add-multiple-types-filter.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('⚡ Ejecutando actualización del stored procedure...');
    await client.query(sql);
    
    console.log('✅ Stored procedure actualizado correctamente!\n');
    
    // Verificar que la función se actualizó
    const result = await client.query(`
      SELECT 
        proname as function_name,
        pronargs as num_arguments
      FROM pg_proc 
      WHERE proname = 'get_pokemon_paginated'
      ORDER BY pronargs
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Versiones de la función encontradas:');
      result.rows.forEach(row => {
        console.log(`  - ${row.function_name} con ${row.num_arguments} parámetros`);
      });
      
      const has7Params = result.rows.some(row => row.num_arguments === 7);
      if (has7Params) {
        console.log('\n🎉 El filtro de múltiples tipos ha sido agregado exitosamente!');
        console.log('   Ahora puedes filtrar por varios tipos a la vez (ej: fire,water,grass)');
      }
    }
    
    // Hacer una prueba
    console.log('\n🧪 Haciendo prueba con tipos "fire,water"...');
    const testResult = await client.query(`
      SELECT id, name, types 
      FROM get_pokemon_paginated(1, 5, NULL, NULL, 'id', 'ASC', 'fire,water')
      ORDER BY id
    `);
    
    if (testResult.rows.length > 0) {
      console.log('✓ Resultados de prueba:');
      testResult.rows.forEach(row => {
        console.log(`  - #${row.id} ${row.name} (${row.types.join(', ')})`);
      });
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✨ ¡Actualización completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al actualizar el stored procedure:', error.message);
    await pool.end();
    process.exit(1);
  }
}

updateStoredProcedure();
