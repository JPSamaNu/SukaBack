const PostgresDatabase = require('../database/PostgresDatabase');
const fs = require('fs');
const path = require('path');

async function createTeamsTables() {
  const db = new PostgresDatabase();
  
  try {
    await db.connect();
    console.log('📦 Creando tablas de equipos...\n');

    // Leer el script SQL
    const sqlPath = path.join(__dirname, '../database/create-teams-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el script
    await db.query(sql);

    console.log('✅ Tablas creadas exitosamente\n');

    // Verificar las tablas
    const tablesCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teams', 'team_pokemons')
      ORDER BY table_name
    `);

    console.log('📋 Tablas creadas:');
    console.table(tablesCheck.rows);

    // Verificar estructura de teams
    const teamsColumns = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Estructura de tabla teams:');
    console.table(teamsColumns.rows);

    // Verificar estructura de team_pokemons
    const teamPokemonsColumns = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'team_pokemons' 
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Estructura de tabla team_pokemons:');
    console.table(teamPokemonsColumns.rows);

    // Verificar constraints
    const constraints = await db.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name IN ('teams', 'team_pokemons')
      ORDER BY tc.table_name, tc.constraint_type
    `);

    console.log('\n🔒 Constraints:');
    console.table(constraints.rows);

    console.log('\n✨ ¡Todo listo! Las tablas de equipos fueron creadas correctamente.');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Reiniciar el backend para que cargue las nuevas entidades');
    console.log('   2. Probar los endpoints de equipos desde el frontend o Swagger');
    console.log('   3. Los equipos se crean automáticamente asociados al usuario autenticado');

  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
    console.error(error);
  } finally {
    if (db.pool) {
      await db.pool.end();
    }
  }
}

createTeamsTables();
