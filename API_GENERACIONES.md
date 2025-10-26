# 🌟 API Generaciones - SukaDex

## Endpoints de Generaciones de Pokemon

### 📋 Listar Todas las Generaciones

#### GET `/api/v1/generations`
Obtiene información de todas las generaciones de Pokemon disponibles.

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "generation-i",
      "region": "Kanto",
      "pokemonCount": 151
    },
    {
      "id": 2,
      "name": "generation-ii",
      "region": "Johto",
      "pokemonCount": 100
    },
    {
      "id": 3,
      "name": "generation-iii",
      "region": "Hoenn",
      "pokemonCount": 135
    },
    {
      "id": 4,
      "name": "generation-iv",
      "region": "Sinnoh",
      "pokemonCount": 107
    },
    {
      "id": 5,
      "name": "generation-v",
      "region": "Unova",
      "pokemonCount": 156
    },
    {
      "id": 6,
      "name": "generation-vi",
      "region": "Kalos",
      "pokemonCount": 72
    },
    {
      "id": 7,
      "name": "generation-vii",
      "region": "Alola",
      "pokemonCount": 88
    },
    {
      "id": 8,
      "name": "generation-viii",
      "region": "Galar",
      "pokemonCount": 96
    },
    {
      "id": 9,
      "name": "generation-ix",
      "region": "Paldea",
      "pokemonCount": 120
    }
  ],
  "total": 9,
  "message": "Lista de todas las generaciones de Pokemon"
}
```

---

### 🔍 Información de una Generación

#### GET `/api/v1/generations/:id`
Obtiene información completa de una generación específica incluyendo sus Pokemon.

**Ejemplo:**
```
GET /api/v1/generations/1
```

**Respuesta:**
```json
{
  "generation": 1,
  "info": {
    "id": 1,
    "name": "generation-i",
    "region": "Kanto",
    "pokemonCount": 151
  },
  "pokemonCount": 151,
  "pokemon": [
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
      "sprites": {...}
    },
    // ... 150 Pokemon más
  ]
}
```

---

### 🎮 Pokemon de una Generación

#### GET `/api/v1/generations/:id/pokemon`
Obtiene solo la lista de Pokemon de una generación (sin info adicional).

**Ejemplo:**
```
GET /api/v1/generations/1/pokemon
```

**Respuesta:**
```json
{
  "generation": 1,
  "data": [
    {
      "id": 1,
      "name": "bulbasaur",
      "types": ["grass", "poison"],
      ...
    },
    ...
  ],
  "total": 151
}
```

---

### 📊 Conteo por Generación

#### GET `/api/v1/generations/:id/count`
Obtiene el número total de Pokemon en una generación.

**Ejemplo:**
```
GET /api/v1/generations/1/count
```

**Respuesta:**
```json
{
  "generation": 1,
  "count": 151,
  "message": "La generación 1 tiene 151 Pokemon"
}
```

---

## 🎯 Endpoints en Pokemon Controller (alternativos)

### GET `/api/v1/pokemon/generations`
Alternativa para obtener todas las generaciones (mismo resultado que `/api/v1/generations`).

### GET `/api/v1/pokemon/generation/:id`
Obtener Pokemon por generación desde el controlador de Pokemon.

**Ejemplo:**
```
GET /api/v1/pokemon/generation/1
```

**Respuesta:**
```json
{
  "data": [...],
  "total": 151,
  "generation": 1,
  "message": "Pokemon de la generación 1"
}
```

### GET `/api/v1/pokemon/generation/:id/count`
Conteo de Pokemon por generación desde el controlador de Pokemon.

---

## 📚 Generaciones Disponibles

| ID | Nombre | Región | Pokemon |
|----|--------|--------|---------|
| 1  | Generation I   | Kanto   | 151 |
| 2  | Generation II  | Johto   | 100 |
| 3  | Generation III | Hoenn   | 135 |
| 4  | Generation IV  | Sinnoh  | 107 |
| 5  | Generation V   | Unova   | 156 |
| 6  | Generation VI  | Kalos   | 72  |
| 7  | Generation VII | Alola   | 88  |
| 8  | Generation VIII| Galar   | 96  |
| 9  | Generation IX  | Paldea  | 120 |

**Total**: 1,025 Pokemon base (is_default=true)

---

## 💡 Ejemplos de Uso

### Obtener todas las generaciones:
```javascript
const response = await fetch('http://localhost:2727/api/v1/generations');
const { data } = await response.json();
console.log(`Hay ${data.length} generaciones disponibles`);
```

### Obtener Pokemon de Kanto (Gen 1):
```javascript
const response = await fetch('http://localhost:2727/api/v1/generations/1/pokemon');
const { data, total } = await response.json();
console.log(`Generación 1 tiene ${total} Pokemon`);
```

### Verificar cuántos Pokemon tiene una generación:
```javascript
const response = await fetch('http://localhost:2727/api/v1/generations/5/count');
const { count } = await response.json();
console.log(`Generación 5 (Unova) tiene ${count} Pokemon`);
```

---

## 🚀 Casos de Uso Frontend

### 1. Selector de Generaciones
```javascript
// Cargar selector de generaciones
const generations = await fetch('/api/v1/generations').then(r => r.json());

// Renderizar opciones
generations.data.forEach(gen => {
  console.log(`${gen.region}: ${gen.pokemonCount} Pokemon`);
});
```

### 2. Filtrar Pokemon por Generación
```javascript
// Usuario selecciona generación
const selectedGen = 3; // Hoenn

// Cargar Pokemon de esa generación
const response = await fetch(`/api/v1/generations/${selectedGen}/pokemon`);
const { data, total } = await response.json();

// Mostrar Pokemon de Hoenn
data.forEach(pokemon => {
  console.log(pokemon.name); // treecko, torchic, mudkip, ...
});
```

### 3. Estadísticas por Generación
```javascript
// Dashboard con stats de cada generación
const generations = await fetch('/api/v1/generations').then(r => r.json());

generations.data.forEach(async (gen) => {
  const count = await fetch(`/api/v1/generations/${gen.id}/count`)
    .then(r => r.json());
  
  console.log(`${gen.region}: ${count.count} Pokemon`);
});
```

---

## 🔗 Rutas Relacionadas

- Ver todos los Pokemon: `GET /api/v1/pokemon/all`
- Pokemon paginados: `GET /api/v1/pokemon?page=1&limit=50`
- Pokemon por ID: `GET /api/v1/pokemon/:id`
- Conteo total: `GET /api/v1/pokemon/count`
