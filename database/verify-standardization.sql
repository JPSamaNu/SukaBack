-- ================================================
-- SCRIPT DE VERIFICACIÓN - Formato Estandarizado
-- ================================================
-- Ejecutar este script DESPUÉS de aplicar standardize-data-format.sql

\echo '🔍 VERIFICANDO ESTANDARIZACIÓN DE DATOS...'
\echo ''

-- ================================================
-- 1. Verificar Vista Materializada
-- ================================================

\echo '📊 1. Verificando vista materializada mv_pokemon_complete...'
SELECT 
  'Total Pokémon: ' || COUNT(*) as resultado
FROM mv_pokemon_complete;

\echo ''
\echo '📦 Primeros 3 Pokémon con tipos y habilidades:'
SELECT 
  id,
  name,
  types,
  abilities
FROM mv_pokemon_complete
LIMIT 3;

-- ================================================
-- 2. Verificar Función de Paginación
-- ================================================

\echo ''
\echo '📊 2. Verificando función get_pokemon_paginated...'
SELECT 
  id,
  name,
  jsonb_pretty(types) as types_formatted,
  jsonb_pretty(abilities) as abilities_formatted
FROM get_pokemon_paginated(1, 3, NULL, NULL, 'id', 'ASC');

-- ================================================
-- 3. Verificar Función Pokemon por ID
-- ================================================

\echo ''
\echo '📊 3. Verificando función get_pokemon_by_id...'
\echo 'Bulbasaur (ID: 1):'
SELECT 
  id,
  name,
  jsonb_pretty(types) as types,
  jsonb_pretty(abilities) as abilities,
  jsonb_pretty(stats) as stats
FROM get_pokemon_by_id(1);

\echo ''
\echo 'Charizard (ID: 6):'
SELECT 
  id,
  name,
  jsonb_pretty(types) as types,
  jsonb_pretty(abilities) as abilities,
  jsonb_pretty(stats) as stats
FROM get_pokemon_by_id(6);

-- ================================================
-- 4. Verificar Función Pokemon por Generación
-- ================================================

\echo ''
\echo '📊 4. Verificando función get_pokemon_by_generation...'
SELECT 
  id,
  name,
  types,
  abilities
FROM get_pokemon_by_generation(1)
LIMIT 5;

-- ================================================
-- 5. Verificar Función de Búsqueda
-- ================================================

\echo ''
\echo '📊 5. Verificando función search_pokemon...'
SELECT 
  id,
  name,
  types,
  abilities
FROM search_pokemon('pika', 3);

-- ================================================
-- 6. Validar Formato de Datos
-- ================================================

\echo ''
\echo '✅ 6. Validando formato de datos...'

-- Verificar que types es JSONB de objetos (no array de strings)
SELECT 
  CASE 
    WHEN jsonb_typeof(types) = 'array' AND 
         jsonb_typeof(types->0) = 'object' AND
         (types->0->>'name') IS NOT NULL
    THEN '✅ Types: Formato correcto (JSONB array de objetos)'
    ELSE '❌ Types: Formato incorrecto'
  END as validation_types
FROM mv_pokemon_complete
WHERE id = 1;

-- Verificar que abilities es JSONB de objetos
SELECT 
  CASE 
    WHEN jsonb_typeof(abilities) = 'array' AND 
         jsonb_typeof(abilities->0) = 'object' AND
         (abilities->0->>'name') IS NOT NULL
    THEN '✅ Abilities: Formato correcto (JSONB array de objetos)'
    ELSE '❌ Abilities: Formato incorrecto'
  END as validation_abilities
FROM mv_pokemon_complete
WHERE id = 1;

-- Verificar que stats tiene base_stat (no baseStat)
SELECT 
  CASE 
    WHEN (stats->0->>'base_stat') IS NOT NULL
    THEN '✅ Stats: Formato correcto (base_stat en snake_case)'
    WHEN (stats->0->>'baseStat') IS NOT NULL
    THEN '⚠️  Stats: Formato camelCase detectado (debería ser snake_case)'
    ELSE '❌ Stats: Formato incorrecto'
  END as validation_stats
FROM get_pokemon_by_id(1);

-- ================================================
-- 7. Verificar Índices
-- ================================================

\echo ''
\echo '🔍 7. Verificando índices...'
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('mv_pokemon_complete', 'mv_generations_summary')
ORDER BY tablename, indexname;

-- ================================================
-- RESUMEN FINAL
-- ================================================

\echo ''
\echo '================================================'
\echo '✅ VERIFICACIÓN COMPLETADA'
\echo '================================================'
\echo ''
\echo 'Si todos los formatos son correctos, puedes:'
\echo '1. Reiniciar el backend (si es necesario)'
\echo '2. Limpiar caché del frontend'
\echo '3. Probar la aplicación'
\echo ''
\echo 'Formato esperado:'
\echo '  - Types: [{name: string, slot: number}]'
\echo '  - Abilities: [{name: string, slot: number, is_hidden: boolean}]'
\echo '  - Stats: [{name: string, base_stat: number, effort: number}]'
\echo ''
