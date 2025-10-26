# 🎮 API Pokemon - SukaDex

## 🚀 Endpoints Disponibles

### 📊 Conteo y Estadísticas

#### GET `/api/v1/pokemon/count`
Obtiene el total de Pokemon en la base de datos.

**Respuesta:**
```json
{
  "total": 1025,
  "message": "Total de Pokemon en la base de datos: 1025"
}
```

---

### 📋 Listado de Pokemon

#### GET `/api/v1/pokemon/all`
Obtiene **TODOS** los Pokemon sin paginación (1,025+ Pokemon).

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "bulbasaur",
      "baseExperience": 64,
      "height": 7,
      "weight": 69,
      "speciesId": 1,
      "speciesName": "bulbasaur",
      "generationId": 1,
      "generationName": "generation-i",
      "types": ["grass", "poison"],
      "sprites": {
        "front_default": "url...",
        "front_shiny": "url...",
        "official_artwork": "url..."
      }
    }
  ],
  "total": 1025,
  "message": "Se obtuvieron 1025 Pokemon correctamente"
}
```

---

#### GET `/api/v1/pokemon`
Obtiene lista paginada de Pokemon con filtros.

**Query Parameters:**
- `page` (number, default: 1) - Número de página
- `limit` (number, default: 20) - Pokemon por página
- `generation` (number) - Filtrar por generación (1-9)
- `search` (string) - Buscar por nombre
- `sortBy` ('id' | 'name' | 'base_experience', default: 'id')
- `sortOrder` ('ASC' | 'DESC', default: 'ASC')

**Ejemplo:**
```
GET /api/v1/pokemon?page=1&limit=50&generation=1&sortBy=name&sortOrder=ASC
```

**Respuesta:**
```json
{
  "data": [...],
  "total": 151,
  "page": 1,
  "limit": 50,
  "totalPages": 4
}
```

---

### 🔍 Detalles de Pokemon

#### GET `/api/v1/pokemon/:id`
Obtiene información detallada de un Pokemon específico.

**Ejemplo:**
```
GET /api/v1/pokemon/25
```

**Respuesta:**
```json
{
  "id": 25,
  "name": "pikachu",
  "baseExperience": 112,
  "height": 4,
  "weight": 60,
  "speciesId": 25,
  "speciesName": "pikachu",
  "generationId": 1,
  "generationName": "generation-i",
  "types": ["electric"],
  "abilities": ["static", "lightning-rod"],
  "stats": [
    { "name": "hp", "baseStat": 35, "effort": 0 },
    { "name": "attack", "baseStat": 55, "effort": 0 },
    { "name": "defense", "baseStat": 40, "effort": 0 },
    { "name": "special-attack", "baseStat": 50, "effort": 0 },
    { "name": "special-defense", "baseStat": 50, "effort": 0 },
    { "name": "speed", "baseStat": 90, "effort": 2 }
  ],
  "sprites": {...}
}
```

---

### 🌟 Pokemon por Generación

#### GET `/api/v1/pokemon/generation/:id`
Obtiene todos los Pokemon de una generación específica.

**Generaciones disponibles:**
- 1: Kanto (Bulbasaur - Mew)
- 2: Johto (Chikorita - Celebi)
- 3: Hoenn (Treecko - Deoxys)
- 4: Sinnoh (Turtwig - Arceus)
- 5: Unova (Victini - Genesect)
- 6: Kalos (Chespin - Volcanion)
- 7: Alola (Rowlet - Melmetal)
- 8: Galar (Grookey - Enamorus)
- 9: Paldea (Sprigatito - ???)

**Ejemplo:**
```
GET /api/v1/pokemon/generation/1
```

**Respuesta:**
```json
{
  "data": [...151 Pokemon...],
  "total": 151,
  "generation": 1
}
```

---

## 🗄️ Información de la Base de Datos

### Estadísticas Generales:
- **Pokemon**: 1,328 (incluyendo formas alternativas)
  - Pokemon base (is_default=true): 1,025
- **Movimientos**: 937
- **Items**: 2,180
- **Habilidades**: 367

### Tablas PokeAPI v2:
La base de datos contiene todas las tablas oficiales de PokeAPI con el prefijo `pokemon_v2_*`:
- `pokemon_v2_pokemon` - Pokemon
- `pokemon_v2_pokemonspecies` - Especies
- `pokemon_v2_move` - Movimientos
- `pokemon_v2_item` - Items
- `pokemon_v2_ability` - Habilidades
- `pokemon_v2_type` - Tipos
- `pokemon_v2_generation` - Generaciones
- Y 150+ tablas más...

### Tablas Personalizadas:
- `user_favorites` - Pokemon favoritos
- `user_teams` - Equipos de usuarios
- `team_members` - Miembros de equipos
- `battle_history` - Historial de batallas
- `pokemon_ratings` - Calificaciones
- `custom_pokemon_nicknames` - Apodos personalizados
- `user_achievements` - Logros
- `pokemon_encounters_log` - Registro de encuentros

---

## 🔧 Configuración

### Variables de Entorno (`.env`):
```env
# Puerto del servidor
PORT=2727

# Base de datos PostgreSQL (AWS RDS)
DATABASE_URL=postgresql://suka:SukaBliat123@sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com:5432/sukadb
DB_HOST=sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=suka
DB_PASSWORD=SukaBliat123
DB_NAME=sukadb
```

---

## 📝 Notas Importantes

1. **Endpoint `/api/v1/pokemon/all`** devuelve TODOS los Pokemon sin paginación. Úsalo con precaución ya que puede ser una respuesta grande (~1MB+).

2. Para consultas eficientes, usa el endpoint paginado `/api/v1/pokemon` con filtros.

3. Los sprites pueden ser null para algunos Pokemon. Verifica antes de usarlos en el frontend.

4. Los Pokemon con `is_default=false` son formas alternativas (Mega-evoluciones, formas regionales, etc.).

5. La base de datos está en **modo de solo lectura** para las tablas de PokeAPI (`synchronize: false`).

---

## 🚀 Siguiente Paso

Para consumir estos endpoints desde tu frontend React, puedes usar `axios` o `fetch`:

```javascript
// Obtener todos los Pokemon
const response = await fetch('http://localhost:2727/api/v1/pokemon/all');
const { data, total } = await response.json();
console.log(`Se obtuvieron ${total} Pokemon`);

// Obtener Pokemon con paginación
const response = await fetch('http://localhost:2727/api/v1/pokemon?page=1&limit=50');
const { data, total, totalPages } = await response.json();
```
