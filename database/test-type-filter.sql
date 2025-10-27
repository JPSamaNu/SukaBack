-- ================================================
-- Script de prueba para el filtro por tipo
-- ================================================

-- 1. Verificar que existan ambas versiones de la función
SELECT 
  proname as function_name,
  pronargs as num_params,
  pg_get_function_arguments(oid) as parameters
FROM pg_proc 
WHERE proname = 'get_pokemon_paginated'
ORDER BY pronargs;

-- 2. Probar el filtro de tipo FIRE (debería retornar Charmander, Vulpix, etc.)
SELECT 
  id,
  name,
  types,
  generation_name
FROM get_pokemon_paginated(
  1,        -- page
  10,       -- limit
  NULL,     -- generation
  NULL,     -- search
  'id',     -- sortBy
  'ASC',    -- sortOrder
  'fire'    -- type filter
);

-- 3. Probar el filtro de tipo WATER
SELECT 
  id,
  name,
  types,
  generation_name
FROM get_pokemon_paginated(
  1,        -- page
  10,       -- limit
  NULL,     -- generation
  NULL,     -- search
  'id',     -- sortBy
  'ASC',    -- sortOrder
  'water'   -- type filter
);

-- 4. Probar combinación: tipo GRASS + generación 1
SELECT 
  id,
  name,
  types,
  generation_name
FROM get_pokemon_paginated(
  1,        -- page
  10,       -- limit
  1,        -- generation (Kanto)
  NULL,     -- search
  'id',     -- sortBy
  'ASC',    -- sortOrder
  'grass'   -- type filter
);

-- 5. Probar combinación: tipo FIRE + búsqueda "char"
SELECT 
  id,
  name,
  types,
  generation_name
FROM get_pokemon_paginated(
  1,        -- page
  10,       -- limit
  NULL,     -- generation
  'char',   -- search (Charmander, Charizard)
  'id',     -- sortBy
  'ASC',    -- sortOrder
  'fire'    -- type filter
);

-- 6. Verificar Pokémon con DOS tipos (ej: Bulbasaur = grass/poison)
-- Debe aparecer tanto con filtro 'grass' como con 'poison'
SELECT 
  id,
  name,
  types,
  'Filtrado por GRASS' as test
FROM get_pokemon_paginated(1, 5, NULL, 'bulba', 'id', 'ASC', 'grass')
UNION ALL
SELECT 
  id,
  name,
  types,
  'Filtrado por POISON' as test
FROM get_pokemon_paginated(1, 5, NULL, 'bulba', 'id', 'ASC', 'poison');
