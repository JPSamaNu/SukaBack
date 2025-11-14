const PostgresDatabase = require('../database/PostgresDatabase');
const db = new PostgresDatabase();

async function checkUsersTable() {
  try {
    await db.connect();
    console.log('🔍 Verificando tabla users...\n');

    // Verificar si la tabla existe
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    console.log('¿Tabla users existe?', tableExists.rows[0].exists);

    if (tableExists.rows[0].exists) {
      // Obtener estructura de la tabla
      const columns = await db.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);

      console.log('\n📋 Estructura de la tabla users:');
      console.table(columns.rows);

      // Contar usuarios
      const count = await db.query('SELECT COUNT(*) as total FROM users');
      console.log('\n👥 Total de usuarios:', count.rows[0].total);

      // Mostrar algunos usuarios (sin contraseña)
      if (parseInt(count.rows[0].total) > 0) {
        const users = await db.query(`
          SELECT id, email, role, "createdAt", "updatedAt" 
          FROM users 
          LIMIT 5
        `);
        console.log('\n👤 Primeros usuarios:');
        console.table(users.rows);
      }

      // Verificar constraints
      const constraints = await db.query(`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'users'
        ORDER BY tc.constraint_type, tc.constraint_name
      `);

      console.log('\n🔒 Constraints de la tabla users:');
      console.table(constraints.rows);

      // Verificar índices
      const indexes = await db.query(`
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
      `);

      console.log('\n🔑 Índices de la tabla users:');
      console.table(indexes.rows);
    } else {
      console.log('\n❌ La tabla users NO existe en la base de datos.');
      console.log('\n💡 Necesitas crear la tabla. Opciones:');
      console.log('   1. Activar synchronize: true en ormconfig.ts (TypeORM creará la tabla)');
      console.log('   2. Crear la tabla manualmente con un script SQL');
      console.log('   3. Usar migraciones de TypeORM');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (db.pool) {
      await db.pool.end();
    }
  }
}

checkUsersTable();
