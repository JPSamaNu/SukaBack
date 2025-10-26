-- Verificar tablas personalizadas
SELECT 'TABLAS PERSONALIZADAS CREADAS:' as status;
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_favorites',
    'user_teams', 
    'team_members',
    'battle_history',
    'pokemon_ratings',
    'custom_pokemon_nicknames',
    'user_achievements',
    'pokemon_encounters_log'
  )
ORDER BY tablename;

-- Estadísticas de la base de datos PokeAPI
SELECT 'ESTADÍSTICAS DE POKEAPI:' as status;
SELECT 'Pokemon' as tipo, COUNT(*) as total FROM pokemon_v2_pokemon
UNION ALL
SELECT 'Moves', COUNT(*) FROM pokemon_v2_move
UNION ALL
SELECT 'Items', COUNT(*) FROM pokemon_v2_item
UNION ALL
SELECT 'Abilities', COUNT(*) FROM pokemon_v2_ability;
