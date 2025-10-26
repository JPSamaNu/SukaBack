-- =====================================================
-- Tablas personalizadas para SukaDex
-- Extienden la base de datos oficial de PokeAPI
-- =====================================================

-- Tabla: Pokémon favoritos de usuarios
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pokemon_id)
);

-- Tabla: Equipos de usuarios
CREATE TABLE IF NOT EXISTS user_teams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_name VARCHAR(50) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Miembros de equipos
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES user_teams(id) ON DELETE CASCADE,
    pokemon_id INTEGER NOT NULL,
    nickname VARCHAR(50),
    position INTEGER CHECK (position >= 1 AND position <= 6),
    level INTEGER DEFAULT 50 CHECK (level >= 1 AND level <= 100),
    move_1 INTEGER,
    move_2 INTEGER,
    move_3 INTEGER,
    move_4 INTEGER,
    ability_id INTEGER,
    item_id INTEGER,
    nature VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, position)
);

-- Tabla: Historial de batallas
CREATE TABLE IF NOT EXISTS battle_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id INTEGER REFERENCES user_teams(id) ON DELETE SET NULL,
    opponent_name VARCHAR(100),
    result VARCHAR(10) CHECK (result IN ('win', 'loss', 'draw')),
    battle_format VARCHAR(50),
    battle_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Tabla: Calificaciones de Pokémon
CREATE TABLE IF NOT EXISTS pokemon_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pokemon_id)
);

-- Tabla: Apodos personalizados
CREATE TABLE IF NOT EXISTS custom_pokemon_nicknames (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Logros de usuarios
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Tabla: Registro de encuentros con Pokémon
CREATE TABLE IF NOT EXISTS pokemon_encounters_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL,
    location VARCHAR(100),
    encounter_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    caught BOOLEAN DEFAULT false,
    notes TEXT
);

-- =====================================================
-- Índices para optimizar consultas
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_pokemon ON user_favorites(pokemon_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_user ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_pokemon ON team_members(pokemon_id);
CREATE INDEX IF NOT EXISTS idx_battle_history_user ON battle_history(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_history_team ON battle_history(team_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_ratings_user ON pokemon_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_ratings_pokemon ON pokemon_ratings(pokemon_id);
CREATE INDEX IF NOT EXISTS idx_custom_nicknames_user ON custom_pokemon_nicknames(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_encounters_user ON pokemon_encounters_log(user_id);
CREATE INDEX IF NOT EXISTS idx_encounters_pokemon ON pokemon_encounters_log(pokemon_id);

-- =====================================================
-- Comentarios en tablas
-- =====================================================

COMMENT ON TABLE user_favorites IS 'Pokémon marcados como favoritos por usuarios';
COMMENT ON TABLE user_teams IS 'Equipos de Pokémon creados por usuarios';
COMMENT ON TABLE team_members IS 'Pokémon individuales dentro de cada equipo';
COMMENT ON TABLE battle_history IS 'Historial de batallas de los usuarios';
COMMENT ON TABLE pokemon_ratings IS 'Calificaciones y reseñas de Pokémon por usuarios';
COMMENT ON TABLE custom_pokemon_nicknames IS 'Apodos personalizados para Pokémon';
COMMENT ON TABLE user_achievements IS 'Logros desbloqueados por usuarios';
COMMENT ON TABLE pokemon_encounters_log IS 'Registro de encuentros con Pokémon';

-- =====================================================
-- Fin del script
-- =====================================================
