-- Script para crear las tablas de equipos Pokémon
-- Ejecutar este script en la base de datos sukadb

-- Tabla principal de equipos
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Tabla de Pokémon en equipos
CREATE TABLE IF NOT EXISTS team_pokemons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "teamId" UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    "pokemonId" INTEGER NOT NULL,
    "pokemonName" VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 6),
    nickname VARCHAR(100),
    moves JSONB,
    ability VARCHAR(100),
    item VARCHAR(100),
    nature VARCHAR(50),
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT unique_team_position UNIQUE ("teamId", position)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams("userId");
CREATE INDEX IF NOT EXISTS idx_team_pokemons_team_id ON team_pokemons("teamId");
CREATE INDEX IF NOT EXISTS idx_team_pokemons_pokemon_id ON team_pokemons("pokemonId");

-- Comentarios para documentación
COMMENT ON TABLE teams IS 'Equipos Pokémon creados por usuarios';
COMMENT ON TABLE team_pokemons IS 'Pokémon que forman parte de los equipos (máximo 6 por equipo)';
COMMENT ON COLUMN team_pokemons.position IS 'Posición del Pokémon en el equipo (1-6)';
COMMENT ON COLUMN team_pokemons.moves IS 'Array JSON con los movimientos del Pokémon (máximo 4)';
