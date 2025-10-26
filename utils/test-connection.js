/**
 * Script de verificación de conexión a PostgreSQL
 * 
 * Uso:
 *   node utils/test-connection.js
 */

const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

async function testConnection() {
  console.log('\n🔍 Verificando conexión a PostgreSQL...\n');
  
  const db = new PostgresDatabase();
  
  try {
    // Intentar conectar
    await db.connect();
    
    // Verificar versión de PostgreSQL
    const versionResult = await db.get('SELECT version()');
    console.log('📌 Versión de PostgreSQL:');
    console.log(`   ${versionResult.version.split('\n')[0]}\n`);
    
    // Verificar base de datos actual
    const dbResult = await db.get('SELECT current_database()');
    console.log(`📂 Base de datos actual: ${dbResult.current_database}\n`);
    
    // Verificar usuario actual
    const userResult = await db.get('SELECT current_user');
    console.log(`👤 Usuario actual: ${userResult.current_user}\n`);
    
    // Listar tablas existentes
    const tablesResult = await db.all(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    if (tablesResult.length > 0) {
      console.log('📋 Tablas existentes:');
      tablesResult.forEach(t => console.log(`   - ${t.tablename}`));
      console.log('');
    } else {
      console.log('📋 No hay tablas creadas aún.\n');
    }
    
    // Contar registros en tablas de Pokemon (si existen)
    try {
      const pokemonCount = await db.get('SELECT COUNT(*) as count FROM pokemon');
      const typeCount = await db.get('SELECT COUNT(*) as count FROM type');
      const moveCount = await db.get('SELECT COUNT(*) as count FROM move');
      
      console.log('📊 Datos actuales:');
      console.log(`   Pokemon:      ${pokemonCount.count}`);
      console.log(`   Tipos:        ${typeCount.count}`);
      console.log(`   Movimientos:  ${moveCount.count}`);
      console.log('');
    } catch (error) {
      // Tablas no existen aún
    }
    
    console.log('✅ Conexión exitosa! La base de datos está lista.\n');
    
    // Mostrar configuración (sin mostrar password completa)
    console.log('🔧 Configuración usada:');
    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL;
      const masked = url.replace(/:([^@]+)@/, ':****@');
      console.log(`   DATABASE_URL: ${masked}`);
    } else {
      console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`   DB_PORT: ${process.env.DB_PORT || '5432'}`);
      console.log(`   DB_NAME: ${process.env.DB_NAME || 'sukadb'}`);
      console.log(`   DB_USER: ${process.env.DB_USERNAME || 'postgres'}`);
      console.log(`   DB_PASS: ****`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Error de conexión:\n');
    console.error(`   ${error.message}\n`);
    
    console.log('💡 Posibles soluciones:');
    console.log('   1. Verifica que PostgreSQL esté corriendo');
    console.log('   2. Verifica las credenciales en el archivo .env');
    console.log('   3. Verifica que la base de datos "sukadb" exista');
    console.log('   4. Si usas AWS RDS, verifica los Security Groups');
    console.log('   5. Verifica que tu IP esté permitida\n');
    
    process.exit(1);
  } finally {
    await db.close();
  }
}

testConnection();
