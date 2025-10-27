-- ================================================
-- FIX: Actualizar función get_pokemon_by_id para corregir ambigüedad en sprites
-- ================================================

DROP FUNCTION IF EXISTS get_pokemon_by_id(INTEGER);

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
    -- Sprites (FIX: usar alias para evitar ambigüedad)
    (
      SELECT psprites.sprites
      FROM pokemon_v2_pokemonsprites psprites
      WHERE psprites.pokemon_id = p.id
      LIMIT 1
    )::JSONB as sprites
  FROM pokemon_v2_pokemon p
  INNER JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
  INNER JOIN pokemon_v2_generation g ON ps.generation_id = g.id
  WHERE p.id = p_pokemon_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verificar que funciona
SELECT id, name, sprites FROM get_pokemon_by_id(1);

SELECT 'Función get_pokemon_by_id actualizada correctamente ✅' as resultado;
