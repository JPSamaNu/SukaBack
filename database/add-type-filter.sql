-- ================================================
-- Actualizar función get_pokemon_paginated para soportar filtro por tipo
-- ================================================

CREATE OR REPLACE FUNCTION get_pokemon_paginated(
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20,
  p_generation INTEGER DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'id',
  p_sort_order TEXT DEFAULT 'ASC',
  p_type TEXT DEFAULT NULL  -- Nuevo parámetro para filtrar por tipo
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
BEGIN
  v_offset := (p_page - 1) * p_limit;
  
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
        p_type IS NULL 
        OR p_type = ANY(mv.types)  -- Busca el tipo en el array de tipos
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
  proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname = 'get_pokemon_paginated';
