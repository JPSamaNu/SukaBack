/**
 * 🎮 Script Interactivo: Setup PokeAPI Database
 * 
 * Este script te guía paso a paso para configurar tu base de datos PokeAPI
 * 
 * Uso: node database/setup-wizard.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🎮 ASISTENTE DE CONFIGURACIÓN DE BASE DE DATOS POKEAPI');
  console.log('='.repeat(70) + '\n');

  console.log('Bienvenido! Este asistente te ayudará a configurar tu base de datos.\n');

  // Paso 1: Elegir método
  console.log('📋 PASO 1: Elige tu método de importación\n');
  console.log('1. 🐳 Docker + Dump (RECOMENDADO)');
  console.log('   - Más rápido (~20 minutos)');
  console.log('   - Datos oficiales completos');
  console.log('   - Requiere Docker Desktop\n');
  
  console.log('2. 📄 Import desde CSV');
  console.log('   - Sin Docker');
  console.log('   - Más lento (~45 minutos)');
  console.log('   - Requiere clonar repo PokeAPI\n');
  
  console.log('3. 🌐 Seeder desde API');
  console.log('   - MUY lento (2-4 horas)');
  console.log('   - No requiere herramientas extra');
  console.log('   - Ya implementado en este proyecto\n');

  const method = await question('Selecciona una opción (1/2/3): ');

  console.log('\n');

  if (method === '1') {
    // Docker + Dump
    console.log('='.repeat(70));
    console.log('✅ Has elegido: Docker + Dump');
    console.log('='.repeat(70) + '\n');

    console.log('📋 PASOS A SEGUIR:\n');
    
    console.log('1️⃣  Instalar Docker Desktop');
    console.log('   Descarga: https://www.docker.com/products/docker-desktop/');
    console.log('   Instala y reinicia tu PC\n');
    
    console.log('2️⃣  Clonar repositorio PokeAPI');
    console.log('   PowerShell:');
    console.log('   cd $env:USERPROFILE\\Desktop');
    console.log('   git clone --recurse-submodules https://github.com/PokeAPI/pokeapi.git');
    console.log('   cd pokeapi\n');
    
    console.log('3️⃣  Levantar con Docker Compose');
    console.log('   docker compose up -d');
    console.log('   (Espera 10-15 minutos mientras construye la base de datos)\n');
    
    console.log('4️⃣  Verificar que funciona');
    console.log('   Abre: http://localhost/api/v2/pokemon/pikachu\n');
    
    console.log('5️⃣  Exportar base de datos');
    console.log('   docker compose exec -T db pg_dump -U pokeapi -d pokeapi --clean --if-exists > pokeapi_complete.sql\n');
    
    console.log('6️⃣  Importar a AWS RDS');
    console.log('   $env:PGPASSWORD="tu_password"');
    console.log('   psql -h sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com -U suka -d sukadb -f pokeapi_complete.sql\n');
    
    console.log('7️⃣  Crear tablas personalizadas');
    console.log('   cd C:\\Users\\Teddy\\Desktop\\SukaDex\\SukaBack');
    console.log('   npm run db:custom-tables\n');
    
    console.log('✅ COMPLETADO! Tu base de datos estará lista para usar.\n');

  } else if (method === '2') {
    // CSV Import
    console.log('='.repeat(70));
    console.log('✅ Has elegido: Import desde CSV');
    console.log('='.repeat(70) + '\n');

    console.log('📋 PASOS A SEGUIR:\n');
    
    console.log('1️⃣  Clonar repositorio PokeAPI (solo datos)');
    console.log('   cd $env:USERPROFILE\\Desktop');
    console.log('   git clone https://github.com/PokeAPI/pokeapi.git --depth 1\n');
    
    console.log('2️⃣  Ejecutar importador CSV');
    console.log('   cd C:\\Users\\Teddy\\Desktop\\SukaDex\\SukaBack');
    console.log('   npm run db:import-csv\n');
    
    console.log('⚠️  NOTA: Esta opción requiere tener el schema de PokeAPI creado.');
    console.log('    Recomendamos usar Opción 1 (Docker) para mejor resultado.\n');

  } else if (method === '3') {
    // Seeder API
    console.log('='.repeat(70));
    console.log('✅ Has elegido: Seeder desde API');
    console.log('='.repeat(70) + '\n');

    console.log('📋 PASOS A SEGUIR:\n');
    
    console.log('⏱️  Tiempo estimado: 2-4 horas para todas las generaciones\n');
    
    console.log('Opción A: Cargar generación por generación (RECOMENDADO)');
    console.log('   npm run seed:complete:gen1    # Gen 1 (151 Pokemon) ~25 min');
    console.log('   npm run seed:complete:gen2    # Gen 2 (100 Pokemon) ~15 min');
    console.log('   npm run seed:complete:gen3    # Gen 3 (135 Pokemon) ~20 min');
    console.log('   ... etc\n');
    
    console.log('Opción B: Cargar todo de una vez');
    console.log('   npm run seed:complete:full    # TODAS (1025 Pokemon) ~3 horas\n');
    
    console.log('Monitorear progreso:');
    console.log('   npm run db:monitor            # Actualización en tiempo real\n');
    
    console.log('⚠️  ADVERTENCIA:');
    console.log('   - Proceso MUY lento');
    console.log('   - Puede interrumpirse');
    console.log('   - Sujeto a rate limits de PokeAPI');
    console.log('   - Recomendamos Opción 1 (Docker) si es posible\n');

  } else {
    console.log('❌ Opción no válida. Por favor ejecuta el script de nuevo.\n');
    rl.close();
    return;
  }

  console.log('='.repeat(70));
  console.log('📚 RECURSOS ADICIONALES');
  console.log('='.repeat(70) + '\n');
  
  console.log('📖 Documentación detallada:');
  console.log('   - SETUP_POKEAPI_DB.md     (Guía paso a paso con Docker)');
  console.log('   - BEST_STRATEGY.md         (Comparación de opciones)\n');
  
  console.log('🛠️  Scripts disponibles:');
  console.log('   npm run db:custom-tables   (Crear tus tablas personalizadas)');
  console.log('   npm run db:monitor         (Monitorear progreso)');
  console.log('   npm run query              (Consultar estadísticas)\n');

  console.log('='.repeat(70) + '\n');

  const continueCustom = await question('¿Quieres crear las tablas personalizadas ahora? (s/n): ');

  if (continueCustom.toLowerCase() === 's' || continueCustom.toLowerCase() === 'y') {
    console.log('\n🔧 Creando tablas personalizadas...\n');
    console.log('Ejecuta: npm run db:custom-tables\n');
  }

  console.log('✅ Configuración completada! Buena suerte con tu proyecto 🚀\n');

  rl.close();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
