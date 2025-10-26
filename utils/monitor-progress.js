/**
 * Script para monitorear el progreso del seeder en tiempo real
 * Uso: node utils/monitor-progress.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function showProgress() {
  try {
    // Contar Pokemon por generación
    const result = await pool.query(`
      SELECT 
        CASE 
          WHEN id BETWEEN 1 AND 151 THEN 1
          WHEN id BETWEEN 152 AND 251 THEN 2
          WHEN id BETWEEN 252 AND 386 THEN 3
          WHEN id BETWEEN 387 AND 493 THEN 4
          WHEN id BETWEEN 494 AND 649 THEN 5
          WHEN id BETWEEN 650 AND 721 THEN 6
          WHEN id BETWEEN 722 AND 809 THEN 7
          WHEN id BETWEEN 810 AND 905 THEN 8
          WHEN id BETWEEN 906 AND 1025 THEN 9
        END as gen,
        COUNT(*) as count
      FROM pokemon
      GROUP BY gen
      ORDER BY gen
    `);
    
    const total = await pool.query('SELECT COUNT(*) as count FROM pokemon');
    
    const genInfo = {
      1: { name: 'Kanto', max: 151 },
      2: { name: 'Johto', max: 100 },
      3: { name: 'Hoenn', max: 135 },
      4: { name: 'Sinnoh', max: 107 },
      5: { name: 'Unova', max: 156 },
      6: { name: 'Kalos', max: 72 },
      7: { name: 'Alola', max: 88 },
      8: { name: 'Galar', max: 96 },
      9: { name: 'Paldea', max: 120 }
    };
    
    console.clear();
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROGRESO DEL SEEDER POKÉMON');
    console.log('='.repeat(60));
    console.log(`🐾 Total: ${total.rows[0].count}/1025 Pokemon (${(total.rows[0].count / 1025 * 100).toFixed(1)}%)\n`);
    
    for (let gen = 1; gen <= 9; gen++) {
      const genData = result.rows.find(r => r.gen === gen);
      const count = genData ? parseInt(genData.count) : 0;
      const maxCount = genInfo[gen].max;
      const percentage = ((count / maxCount) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / maxCount * 30)) + '░'.repeat(30 - Math.floor(count / maxCount * 30));
      
      console.log(`Gen ${gen} (${genInfo[gen].name.padEnd(8)}): [${bar}] ${count.toString().padStart(3)}/${maxCount} (${percentage.padStart(5)}%)`);
    }
    
    console.log('='.repeat(60));
    console.log('Actualizado: ' + new Date().toLocaleTimeString());
    console.log('Presiona Ctrl+C para salir\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Actualizar cada 5 segundos
console.log('🔄 Iniciando monitoreo del progreso del seeder...\n');
showProgress();
setInterval(showProgress, 5000);

// Manejar Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n👋 Cerrando monitor...');
  await pool.end();
  process.exit(0);
});
