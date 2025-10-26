# 📋 Lista de Endpoints - SukaDex API

**Base URL**: `http://localhost:2727/api/v1`

---

## 🔐 Autenticación

### POST `/auth/register`
Registrar un nuevo usuario.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123",
  "username": "usuario"
}
```

**Respuesta:**
```json
{
  "user": { "id": 1, "email": "usuario@example.com", "username": "usuario" },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

---

### POST `/auth/login`
Iniciar sesión.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "user": { "id": 1, "email": "usuario@example.com" },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

---

### POST `/auth/refresh`
Refrescar el token de acceso.

**Body:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

---

### POST `/auth/logout`
Cerrar sesión.

**Headers:**
```
Authorization: Bearer {access_token}
```

---

### GET `/auth/me`
Obtener información del usuario autenticado.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Respuesta:**
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "username": "usuario",
  "role": "user"
}
```

---

## 👥 Usuarios

### POST `/users`
Crear un nuevo usuario.

**Body:**
```json
{
  "email": "nuevo@example.com",
  "password": "password123",
  "username": "nuevo_usuario"
}
```

---

### GET `/users`
Obtener lista de usuarios (requiere autenticación).

**Headers:**
```
Authorization: Bearer {access_token}
```

---

### GET `/users/me`
Obtener perfil del usuario actual.

**Headers:**
```
Authorization: Bearer {access_token}
```

---

### GET `/users/:id`
Obtener usuario por ID.

**Ejemplo:** `GET /users/1`

---

### PATCH `/users/:id`
Actualizar usuario.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "username": "nuevo_nombre",
  "email": "nuevo_email@example.com"
}
```

---

### DELETE `/users/:id`
Eliminar usuario.

**Headers:**
```
Authorization: Bearer {access_token}
```

---

## 🎮 Pokemon

### GET `/pokemon`
Obtener lista de Pokemon con paginación y filtros.

**Query Parameters:**
- `page` (number, default: 1) - Número de página
- `limit` (number, default: 20) - Pokemon por página
- `generation` (number) - Filtrar por generación (1-9)
- `search` (string) - Buscar por nombre
- `sortBy` ('id' | 'name' | 'base_experience', default: 'id')
- `sortOrder` ('ASC' | 'DESC', default: 'ASC')

**Ejemplo:**
```
GET /pokemon?page=1&limit=50&generation=1&sortBy=name&sortOrder=ASC
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

### GET `/pokemon/all`
Obtener TODOS los Pokemon sin paginación (1,025 Pokemon base).

**⚠️ Advertencia:** Respuesta grande (~1-2MB). Usar con precaución.

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
      "sprites": { "front_default": "url..." }
    }
  ],
  "total": 1025,
  "message": "Se obtuvieron 1025 Pokemon correctamente"
}
```

---

### GET `/pokemon/count`
Obtener total de Pokemon en la base de datos.

**Respuesta:**
```json
{
  "total": 1025,
  "message": "Total de Pokemon en la base de datos: 1025"
}
```

---

### GET `/pokemon/:id`
Obtener detalles completos de un Pokemon por ID.

**Ejemplo:** `GET /pokemon/25`

**Respuesta:**
```json
{
  "id": 25,
  "name": "pikachu",
  "baseExperience": 112,
  "height": 4,
  "weight": 60,
  "types": ["electric"],
  "abilities": ["static", "lightning-rod"],
  "stats": [
    { "name": "hp", "baseStat": 35, "effort": 0 },
    { "name": "attack", "baseStat": 55, "effort": 0 }
  ],
  "sprites": {...}
}
```

---

### GET `/pokemon/generations`
Obtener lista de todas las generaciones (alternativa a `/generations`).

**Respuesta:**
```json
{
  "data": [
    { "id": 1, "name": "generation-i", "region": "Kanto", "pokemonCount": 151 }
  ],
  "total": 9,
  "message": "Generaciones de Pokemon disponibles"
}
```

---

### GET `/pokemon/generation/:id`
Obtener Pokemon de una generación específica.

**Ejemplo:** `GET /pokemon/generation/1`

**Respuesta:**
```json
{
  "data": [...151 Pokemon de Kanto...],
  "total": 151,
  "generation": 1,
  "message": "Pokemon de la generación 1"
}
```

---

### GET `/pokemon/generation/:id/count`
Obtener conteo de Pokemon en una generación.

**Ejemplo:** `GET /pokemon/generation/1/count`

**Respuesta:**
```json
{
  "generation": 1,
  "count": 151,
  "message": "La generación 1 tiene 151 Pokemon"
}
```

---

## 🌟 Generaciones

### GET `/generations`
Obtener todas las generaciones de Pokemon.

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
    }
  ],
  "total": 9,
  "message": "Lista de todas las generaciones de Pokemon"
}
```

---

### GET `/generations/:id`
Obtener información completa de una generación incluyendo sus Pokemon.

**Ejemplo:** `GET /generations/1`

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
  "pokemon": [...todos los Pokemon de la generación...]
}
```

---

### GET `/generations/:id/pokemon`
Obtener solo la lista de Pokemon de una generación.

**Ejemplo:** `GET /generations/1/pokemon`

**Respuesta:**
```json
{
  "generation": 1,
  "data": [...151 Pokemon...],
  "total": 151
}
```

---

### GET `/generations/:id/count`
Obtener el número de Pokemon en una generación.

**Ejemplo:** `GET /generations/1/count`

**Respuesta:**
```json
{
  "generation": 1,
  "count": 151,
  "message": "La generación 1 tiene 151 Pokemon"
}
```

---

## 🏥 Health Check

### GET `/health`
Verificar estado del servidor.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-26T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

### GET `/health/db`
Verificar estado de la base de datos.

**Respuesta:**
```json
{
  "status": "ok",
  "database": "connected",
  "latency": "15ms"
}
```

---

## 📊 Resumen de Endpoints

| Categoría | Total Endpoints |
|-----------|----------------|
| Autenticación | 5 |
| Usuarios | 6 |
| Pokemon | 7 |
| Generaciones | 4 |
| Health Check | 2 |
| **TOTAL** | **24** |

---

## 🔒 Autenticación Requerida

Los siguientes endpoints requieren token de autenticación en el header:

```
Authorization: Bearer {access_token}
```

- `GET /auth/me`
- `POST /auth/logout`
- `GET /users`
- `GET /users/me`
- `PATCH /users/:id`
- `DELETE /users/:id`

---

## 📚 Generaciones Disponibles

| ID | Nombre | Región | Pokemon |
|----|--------|--------|---------|
| 1 | Generation I | Kanto | 151 |
| 2 | Generation II | Johto | 100 |
| 3 | Generation III | Hoenn | 135 |
| 4 | Generation IV | Sinnoh | 107 |
| 5 | Generation V | Unova | 156 |
| 6 | Generation VI | Kalos | 72 |
| 7 | Generation VII | Alola | 88 |
| 8 | Generation VIII | Galar | 96 |
| 9 | Generation IX | Paldea | 120 |

---

## 💡 Ejemplos de Uso con JavaScript

### Obtener todos los Pokemon
```javascript
const response = await fetch('http://localhost:2727/api/v1/pokemon/all');
const { data, total } = await response.json();
console.log(`Total: ${total} Pokemon`);
```

### Obtener Pokemon por generación
```javascript
const gen = 1;
const response = await fetch(`http://localhost:2727/api/v1/generations/${gen}/pokemon`);
const { data } = await response.json();
console.log(`Generación ${gen}:`, data);
```

### Buscar Pokemon paginados
```javascript
const response = await fetch('http://localhost:2727/api/v1/pokemon?page=1&limit=50&search=pika');
const { data, totalPages } = await response.json();
console.log(`Encontrados ${data.length} Pokemon`);
```

### Autenticación
```javascript
// Login
const loginResponse = await fetch('http://localhost:2727/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
});
const { access_token } = await loginResponse.json();

// Usar token
const userResponse = await fetch('http://localhost:2727/api/v1/auth/me', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const user = await userResponse.json();
```

---

## 🚀 Próximos Endpoints (Planificados)

- [ ] `GET /types` - Obtener tipos de Pokemon
- [ ] `GET /abilities` - Obtener habilidades
- [ ] `GET /moves` - Obtener movimientos
- [ ] `GET /items` - Obtener items
- [ ] `POST /favorites` - Agregar Pokemon a favoritos
- [ ] `GET /teams` - Obtener equipos de usuario
- [ ] `POST /teams` - Crear equipo de Pokemon

---

**Última actualización:** 26 de octubre de 2025
