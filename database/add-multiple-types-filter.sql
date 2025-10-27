-- ================================================
-- Actualizar función get_pokemon_paginated para soportar múltiples tipos
-- ================================================

-- Paso 1: Eliminar la función anterior con 7 parámetros
DROP FUNCTION IF EXISTS get_pokemon_paginated(integer,integer,integer,text,text,text,text);

-- Paso 2: Crear la nueva versión que acepta múltiples tipos
CREATE OR REPLACE FUNCTION get_pokemon_paginated(
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20,
  p_generation INTEGER DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'id',
  p_sort_order TEXT DEFAULT 'ASC',
  p_types TEXT DEFAULT NULL  -- Ahora acepta múltiples tipos separados por comas: "fire,water,grass"
)
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  base_experience INTEGER,
  height INTEGER,
  weight INTEGER,
  species_id INTEGER,
  species_name TEXT,
  generation_id INTEGER,
  generation_name TEXT,
  types TEXT[],
  sprites JSONB,
  total_count BIGINT
) AS $$
DECLARE
  v_offset INTEGER;
  v_types_array TEXT[];
BEGIN
  v_offset := (p_page - 1) * p_limit;
  
  -- Convertir string de tipos separados por comas a array
  -- Ejemplo: "fire,water,grass" -> ARRAY['fire', 'water', 'grass']
  IF p_types IS NOT NULL THEN
    v_types_array := string_to_array(p_types, ',');
  END IF;
  
  RETURN QUERY
  WITH filtered_pokemon AS (
    SELECT 
      mv.*,
      COUNT(*) OVER() as total_count
    FROM mv_pokemon_complete mv
    WHERE 
      (p_generation IS NULL OR mv.generation_id = p_generation)
      AND (p_search IS NULL OR mv.name ILIKE '%' || p_search || '%')
      AND (
        p_types IS NULL 
        OR (
          -- Si solo se seleccionó 1 tipo: el Pokémon debe TENER ese tipo (puede tener más)
          CASE WHEN array_length(v_types_array, 1) = 1 THEN
            v_types_array[1] = ANY(mv.types)
          -- Si se seleccionaron 2+ tipos: el Pokémon debe tener EXACTAMENTE esos tipos
          ELSE
            mv.types::TEXT[] @> v_types_array::TEXT[] AND mv.types::TEXT[] <@ v_types_array::TEXT[]
          END
        )
      )
  )
  SELECT 
    fp.id::INTEGER,
    fp.name::TEXT,
    fp.base_experience::INTEGER,
    fp.height::INTEGER,
    fp.weight::INTEGER,
    fp.species_id::INTEGER,
    fp.species_name::TEXT,
    fp.generation_id::INTEGER,
    fp.generation_name::TEXT,
    fp.types::TEXT[],
    fp.sprites::JSONB,
    fp.total_count::BIGINT
  FROM filtered_pokemon fp
  ORDER BY 
    CASE WHEN p_sort_by = 'id' AND p_sort_order = 'ASC' THEN fp.id END ASC,
    CASE WHEN p_sort_by = 'id' AND p_sort_order = 'DESC' THEN fp.id END DESC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'ASC' THEN fp.name END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'DESC' THEN fp.name END DESC
  LIMIT p_limit
  OFFSET v_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verificar que la función se actualizó correctamente
SELECT 
  proname as function_name,
  pronargs as num_arguments,
  pg_get_function_arguments(oid) as parameters
FROM pg_proc 
WHERE proname = 'get_pokemon_paginated'
ORDER BY pronargs;

-- Prueba: Buscar Pokémon que sean fire O water
SELECT 
  id,
  name,
  types
FROM get_pokemon_paginated(1, 10, NULL, NULL, 'id', 'ASC', 'fire,water')
ORDER BY id;
