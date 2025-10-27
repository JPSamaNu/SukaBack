-- ================================================
-- OPTIMIZACIÓN SIMPLIFICADA - SukaDex Database
-- ================================================
-- Ejecutar este script completo en tu cliente SQL
-- Tiempo estimado: 2-3 minutos

-- ================================================
-- PASO 1: Limpiar vistas y funciones anteriores
-- ================================================

DROP MATERIALIZED VIEW IF EXISTS mv_pokemon_complete CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_generations_summary CASCADE;
DROP FUNCTION IF EXISTS get_pokemon_paginated CASCADE;
DROP FUNCTION IF EXISTS get_pokemon_by_generation CASCADE;
DROP FUNCTION IF EXISTS get_pokemon_by_id CASCADE;
DROP FUNCTION IF EXISTS search_pokemon CASCADE;
DROP FUNCTION IF EXISTS refresh_materialized_views CASCADE;

-- ================================================
-- PASO 2: Crear vista materializada de Pokemon
-- ================================================

CREATE MATERIALIZED VIEW mv_pokemon_complete AS
SELECT 
  p.id,
  p.name,
  p.base_experience,
  p.height,
  p.weight,
  p.is_default,
  ps.id as species_id,
  ps.name as species_name,
  ps.generation_id,
  g.name as generation_name,
  -- Array de tipos
  ARRAY(
    SELECT t.name 
    FROM pokemon_v2_pokemontype pt
    INNER JOIN pokemon_v2_type t ON pt.type_id = t.id
    WHERE pt.pokemon_id = p.id
    ORDER BY pt.slot
  ) as types,
  -- Sprites como JSONB
  (
    SELECT sprites
    FROM pokemon_v2_pokemonsprites
    WHERE pokemon_id = p.id
    LIMIT 1
  ) as sprites
FROM pokemon_v2_pokemon p
INNER JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
INNER JOIN pokemon_v2_generation g ON ps.generation_id = g.id
WHERE p.is_default = true
ORDER BY p.id;

-- ================================================
-- PASO 3: Crear índices en vista de Pokemon
-- ================================================

CREATE UNIQUE INDEX idx_mv_pokemon_id ON mv_pokemon_complete(id);
CREATE INDEX idx_mv_pokemon_name ON mv_pokemon_complete(name);
CREATE INDEX idx_mv_pokemon_generation ON mv_pokemon_complete(generation_id);
CREATE INDEX idx_mv_pokemon_types ON mv_pokemon_complete USING GIN(types);

-- ================================================
-- PASO 4: Crear vista materializada de Generaciones
-- ================================================

CREATE MATERIALIZED VIEW mv_generations_summary AS
SELECT 
  g.id,
  g.name,
  CASE 
    WHEN g.id = 1 THEN 'Kanto'
    WHEN g.id = 2 THEN 'Johto'
    WHEN g.id = 3 THEN 'Hoenn'
    WHEN g.id = 4 THEN 'Sinnoh'
    WHEN g.id = 5 THEN 'Unova'
    WHEN g.id = 6 THEN 'Kalos'
    WHEN g.id = 7 THEN 'Alola'
    WHEN g.id = 8 THEN 'Galar'
    WHEN g.id = 9 THEN 'Paldea'
    ELSE 'Unknown'
  END as region,
  COUNT(DISTINCT ps.id)::INTEGER as pokemon_count
FROM pokemon_v2_generation g
LEFT JOIN pokemon_v2_pokemonspecies ps ON ps.generation_id = g.id
GROUP BY g.id, g.name
ORDER BY g.id;

-- ================================================
-- PASO 5: Crear índice en vista de Generaciones
-- ================================================

CREATE UNIQUE INDEX idx_mv_generations_id ON mv_generations_summary(id);

-- ================================================
-- PASO 6: Función de paginación optimizada
-- ================================================

CREATE OR REPLACE FUNCTION get_pokemon_paginated(
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20,
  p_generation INTEGER DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'id',
  p_sort_order TEXT DEFAULT 'ASC'
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

-- ================================================
-- PASO 7: Función Pokemon por Generación
-- ================================================

CREATE OR REPLACE FUNCTION get_pokemon_by_generation(p_generation_id INTEGER)
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
  sprites JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.id::INTEGER,
    mv.name::TEXT,
    mv.base_experience::INTEGER,
    mv.height::INTEGER,
    mv.weight::INTEGER,
    mv.species_id::INTEGER,
    mv.species_name::TEXT,
    mv.generation_id::INTEGER,
    mv.generation_name::TEXT,
    mv.types::TEXT[],
    mv.sprites::JSONB
  FROM mv_pokemon_complete mv
  WHERE mv.generation_id = p_generation_id
  ORDER BY mv.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- PASO 8: Función Pokemon por ID (con detalles)
-- ================================================

CREATE OR REPLACE FUNCTION get_pokemon_by_id(p_pokemon_id INTEGER)
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
  types JSONB,
  abilities JSONB,
  stats JSONB,
  sprites JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::INTEGER,
    p.name::TEXT,
    p.base_experience::INTEGER,
    p.height::INTEGER,
    p.weight::INTEGER,
    ps.id::INTEGER as species_id,
    ps.name::TEXT as species_name,
    ps.generation_id::INTEGER,
    g.name::TEXT as generation_name,
    -- Tipos como JSONB
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'slot', pt.slot,
          'name', t.name
        ) ORDER BY pt.slot
      )
      FROM pokemon_v2_pokemontype pt
      INNER JOIN pokemon_v2_type t ON pt.type_id = t.id
      WHERE pt.pokemon_id = p.id
    )::JSONB as types,
    -- Abilities como JSONB
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', a.name,
          'is_hidden', pa.is_hidden,
          'slot', pa.slot
        ) ORDER BY pa.slot
      )
      FROM pokemon_v2_pokemonability pa
      INNER JOIN pokemon_v2_ability a ON pa.ability_id = a.id
      WHERE pa.pokemon_id = p.id
    )::JSONB as abilities,
    -- Stats como JSONB
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', s.name,
          'base_stat', pst.base_stat,
          'effort', pst.effort
        ) ORDER BY pst.stat_id
      )
      FROM pokemon_v2_pokemonstat pst
      INNER JOIN pokemon_v2_stat s ON pst.stat_id = s.id
      WHERE pst.pokemon_id = p.id
    )::JSONB as stats,
    -- Sprites
    (
      SELECT psprites.sprites
      FROM pokemon_v2_pokemonsprites psprites
      WHERE psprites.pokemon_id = p.id
      LIMIT 1
    )::JSONB as sprites
  FROM pokemon_v2_pokemon p
  INNER JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
  INNER JOIN pokemon_v2_generation g ON ps.generation_id = g.id
  WHERE p.id = p_pokemon_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- PASO 9: Función de búsqueda de Pokemon
-- ================================================

CREATE OR REPLACE FUNCTION search_pokemon(p_search_term TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  generation_id INTEGER,
  types TEXT[],
  sprites JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.id::INTEGER,
    mv.name::TEXT,
    mv.generation_id::INTEGER,
    mv.types::TEXT[],
    mv.sprites::JSONB
  FROM mv_pokemon_complete mv
  WHERE mv.name ILIKE '%' || p_search_term || '%'
  ORDER BY 
    CASE WHEN mv.name = LOWER(p_search_term) THEN 1
         WHEN mv.name LIKE LOWER(p_search_term) || '%' THEN 2
         ELSE 3
    END,
    mv.id
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- PASO 10: Función para refrescar vistas
-- ================================================

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pokemon_complete;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_generations_summary;
  RAISE NOTICE 'Vistas materializadas actualizadas correctamente';
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- PASO 11: Crear índices adicionales
-- ================================================

CREATE INDEX IF NOT EXISTS idx_pokemon_is_default ON pokemon_v2_pokemon(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_pokemon_species ON pokemon_v2_pokemon(pokemon_species_id);
CREATE INDEX IF NOT EXISTS idx_pokemonspecies_generation ON pokemon_v2_pokemonspecies(generation_id);
CREATE INDEX IF NOT EXISTS idx_pokemontype_pokemon ON pokemon_v2_pokemontype(pokemon_id);
CREATE INDEX IF NOT EXISTS idx_pokemonsprites_pokemon ON pokemon_v2_pokemonsprites(pokemon_id);

-- ================================================
-- PASO 12: Analizar tablas para optimizar planner
-- ================================================

ANALYZE pokemon_v2_pokemon;
ANALYZE pokemon_v2_pokemonspecies;
ANALYZE pokemon_v2_generation;
ANALYZE pokemon_v2_pokemontype;
ANALYZE pokemon_v2_type;
ANALYZE pokemon_v2_pokemonsprites;

-- ================================================
-- ✅ SCRIPT COMPLETADO
-- ================================================

-- Verificar que todo se creó correctamente
SELECT 'Vista mv_pokemon_complete creada con ' || COUNT(*) || ' Pokemon' as resultado
FROM mv_pokemon_complete;

SELECT 'Vista mv_generations_summary creada con ' || COUNT(*) || ' generaciones' as resultado
FROM mv_generations_summary;

-- Mostrar las generaciones
SELECT id, name, region, pokemon_count 
FROM mv_generations_summary 
ORDER BY id;

-- ================================================
-- PRUEBAS RÁPIDAS (Descomentar para probar después de crear todo)
-- ================================================

-- -- Probar paginación (primeros 5 Pokemon)
-- SELECT id, name, generation_name, types 
-- FROM get_pokemon_paginated(1, 5, NULL, NULL, 'id', 'ASC');

-- -- Probar Pokemon por generación (primeros 3 de Kanto)
-- SELECT id, name, types 
-- FROM get_pokemon_by_generation(1) 
-- LIMIT 3;

-- -- Probar búsqueda
-- SELECT id, name 
-- FROM search_pokemon('pika', 5);

