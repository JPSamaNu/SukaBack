/**
 * Script para arreglar el constraint UNIQUE en la tabla item
 * 
 * El problema: La tabla item tiene un UNIQUE constraint en 'name', pero PokéAPI
 * tiene items con el mismo nombre y diferentes IDs (ej: tm100).
 * 
 * Solución: Eliminar el constraint UNIQUE de 'name', dejando solo el PRIMARY KEY en 'id'
 * 
 * Uso:
 *   node utils/fix-item-constraint.js
 */

const PostgresDatabase = require('../database/PostgresDatabase');
require('dotenv').config();

async function fixItemConstraint() {
  const db = new PostgresDatabase();
  
  try {
    console.log('\n🔧 Arreglando constraint de la tabla item...\n');
    
    await db.connect();
    
    // 1. Verificar si existe el constraint
    const constraint = await db.get(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'item' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'item_name_key'
    `);
    
    if (!constraint) {
      console.log('✅ El constraint ya no existe. Todo está OK.\n');
      return;
    }
    
    console.log('📋 Constraint encontrado:', constraint.constraint_name);
    
    // 2. Eliminar el constraint UNIQUE de 'name'
    console.log('🗑️  Eliminando constraint UNIQUE de la columna "name"...');
    
    await db.query(`
      ALTER TABLE item DROP CONSTRAINT IF EXISTS item_name_key
    `);
    
    console.log('✅ Constraint eliminado exitosamente!\n');
    
    // 3. Verificar que se eliminó
    const check = await db.get(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'item' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'item_name_key'
    `);
    
    if (!check) {
      console.log('✅ Verificación exitosa. La tabla item ahora acepta nombres duplicados.\n');
      console.log('📊 Estructura actual de la tabla item:');
      console.log('   - id (PRIMARY KEY)');
      console.log('   - name (sin constraint UNIQUE)\n');
      console.log('🎉 Ahora puedes ejecutar el seeder sin problemas!\n');
    } else {
      console.log('❌ Error: El constraint aún existe.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  } finally {
    await db.close();
  }
}

fixItemConstraint();
