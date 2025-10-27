-- ================================================
-- ESTANDARIZACIÓN DE FORMATO DE DATOS
-- ================================================
-- Este script estandariza TODOS los datos a formato JSONB consistente
-- Types, Abilities y Stats siempre retornarán objetos JSONB con estructura uniforme

-- ================================================
-- PASO 1: Recrear vista materializada con tipos como JSONB
-- ================================================

DROP MATERIALIZED VIEW IF EXISTS mv_pokemon_complete CASCADE;

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
  -- Tipos como JSONB (ESTANDARIZADO)
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', t.name,
        'slot', pt.slot
      ) ORDER BY pt.slot
    )
    FROM pokemon_v2_pokemontype pt
    INNER JOIN pokemon_v2_type t ON pt.type_id = t.id
    WHERE pt.pokemon_id = p.id
  ) as types,
  -- Abilities como JSONB (ESTANDARIZADO)
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', a.name,
        'slot', pa.slot,
        'is_hidden', pa.is_hidden
      ) ORDER BY pa.slot
    )
    FROM pokemon_v2_pokemonability pa
    INNER JOIN pokemon_v2_ability a ON pa.ability_id = a.id
    WHERE pa.pokemon_id = p.id
  ) as abilities,
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
-- PASO 2: Recrear índices en vista de Pokemon
-- ================================================

CREATE UNIQUE INDEX idx_mv_pokemon_id ON mv_pokemon_complete(id);
CREATE INDEX idx_mv_pokemon_name ON mv_pokemon_complete(name);
CREATE INDEX idx_mv_pokemon_generation ON mv_pokemon_complete(generation_id);
CREATE INDEX idx_mv_pokemon_types ON mv_pokemon_complete USING GIN(types);
CREATE INDEX idx_mv_pokemon_abilities ON mv_pokemon_complete USING GIN(abilities);

-- ================================================
-- PASO 3: Actualizar función de paginación
-- ================================================

DROP FUNCTION IF EXISTS get_pokemon_paginated CASCADE;

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
  types JSONB,
  abilities JSONB,
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
    fp.types::JSONB,
    fp.abilities::JSONB,
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
-- PASO 4: Actualizar función Pokemon por generación
-- ================================================

DROP FUNCTION IF EXISTS get_pokemon_by_generation CASCADE;

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
  types JSONB,
  abilities JSONB,
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
    mv.types::JSONB,
    mv.abilities::JSONB,
    mv.sprites::JSONB
  FROM mv_pokemon_complete mv
  WHERE mv.generation_id = p_generation_id
  ORDER BY mv.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- PASO 5: Actualizar función Pokemon por ID
-- ================================================

DROP FUNCTION IF EXISTS get_pokemon_by_id CASCADE;

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
    -- Tipos como JSONB (ESTANDARIZADO)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', t.name,
          'slot', pt.slot
        ) ORDER BY pt.slot
      )
      FROM pokemon_v2_pokemontype pt
      INNER JOIN pokemon_v2_type t ON pt.type_id = t.id
      WHERE pt.pokemon_id = p.id
    )::JSONB as types,
    -- Abilities como JSONB (ESTANDARIZADO)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', a.name,
          'slot', pa.slot,
          'is_hidden', pa.is_hidden
        ) ORDER BY pa.slot
      )
      FROM pokemon_v2_pokemonability pa
      INNER JOIN pokemon_v2_ability a ON pa.ability_id = a.id
      WHERE pa.pokemon_id = p.id
    )::JSONB as abilities,
    -- Stats como JSONB (ESTANDARIZADO)
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
    -- Sprites como JSONB
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
-- PASO 6: Actualizar función de búsqueda
-- ================================================

DROP FUNCTION IF EXISTS search_pokemon CASCADE;

CREATE OR REPLACE FUNCTION search_pokemon(p_search_term TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  generation_id INTEGER,
  types JSONB,
  abilities JSONB,
  sprites JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.id::INTEGER,
    mv.name::TEXT,
    mv.generation_id::INTEGER,
    mv.types::JSONB,
    mv.abilities::JSONB,
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
-- VERIFICACIÓN
-- ================================================

-- Verificar vista
SELECT 'Vista mv_pokemon_complete actualizada con ' || COUNT(*) || ' Pokemon' as resultado
FROM mv_pokemon_complete;

-- Verificar que los tipos ahora son JSONB
SELECT id, name, types, abilities
FROM mv_pokemon_complete
LIMIT 5;

-- Verificar función de paginación
SELECT id, name, types, abilities
FROM get_pokemon_paginated(1, 5, NULL, NULL, 'id', 'ASC');

-- Verificar función por ID
SELECT id, name, types, abilities, stats
FROM get_pokemon_by_id(1);

-- ================================================
-- ✅ ESTANDARIZACIÓN COMPLETADA
-- ================================================

SELECT '✅ FORMATO DE DATOS ESTANDARIZADO' as resultado;
SELECT '📦 Types: JSONB [{name: string, slot: number}]' as formato_types;
SELECT '📦 Abilities: JSONB [{name: string, slot: number, is_hidden: boolean}]' as formato_abilities;
SELECT '📦 Stats: JSONB [{name: string, base_stat: number, effort: number}]' as formato_stats;
