# 🎮 SukaBack - Seeder de PokéAPI

## 📋 Resumen Rápido

Este proyecto incluye un **seeder completo** para poblar tu base de datos PostgreSQL (AWS RDS) con datos de PokéAPI v2.

### ✅ ¿Qué hace el seeder?

Carga en tu base de datos:
- ✅ Todos los Pokemon (configurable por generación)
- ✅ Tipos, movimientos, items
- ✅ Versiones y generaciones de juegos
- ✅ Encuentros y ubicaciones
- ✅ Descripciones en Español e Inglés

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos

Asegúrate de que tu archivo `.env` tenga la configuración correcta:

```env
DATABASE_URL=postgresql://suka:SukaBliat123@sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com:5432/sukadb
```

### 3. Ejecutar el seeder

**Opción recomendada para empezar** (Generaciones 1-3, ~30-45 min):

```bash
npm run seed:complete
```

**Otras opciones**:

```bash
# Solo Generación 1 (151 Pokemon, ~15 min)
npm run seed:complete:gen1

# Solo Generación 2 (100 Pokemon, ~12 min)
npm run seed:complete:gen2

# Solo Generación 3 (135 Pokemon, ~18 min)
npm run seed:complete:gen3

# TODOS los Pokemon (1025+, ~2-4 horas)
npm run seed:complete:full
```

---

## 📊 Consultar Datos

Una vez que el seeder termine, puedes consultar los datos:

```bash
# Ver estadísticas
npm run query:stats

# Ver un Pokemon específico
npm run query pokemon 25

# Buscar por nombre
npm run query search pikachu

# Ver todos los tipos
npm run query types
```

---

## 📁 Estructura de Archivos del Seeder

```
SukaBack/
├── database/
│   └── PostgresDatabase.js      # Gestor de conexión a PostgreSQL
├── seeders/
│   └── pokeapi-complete.js      # Seeder principal
├── utils/
│   └── pokemon-query.js         # Utilidad para consultas
├── .env                         # Configuración de base de datos
└── SEEDER_GUIDE.md             # Guía completa del seeder
```

---

## 📖 Documentación Completa

Para más detalles, consulta **[SEEDER_GUIDE.md](./SEEDER_GUIDE.md)** que incluye:

- ✅ Todas las opciones de configuración
- ✅ Queries SQL útiles
- ✅ Troubleshooting
- ✅ Recomendaciones por entorno

---

## 🔧 Configuración Avanzada

Puedes ajustar parámetros en `seeders/pokeapi-complete.js`:

```javascript
const CONFIG = {
  RATE_DELAY_MS: 100,        // Delay entre requests (ms)
  RETRIES: 5,                 // Reintentos por request fallido
  BATCH_SIZE: 50,            // Tamaño de lote
  MAX_CONCURRENT: 5,         // Requests concurrentes máximos
};
```

---

## 🗄️ Tablas Creadas

El seeder crea automáticamente estas tablas:

- `generation` - Generaciones de Pokemon
- `version_group` - Grupos de versiones
- `version` - Versiones de juegos
- `type` - Tipos de Pokemon
- `move` - Movimientos
- `item` - Items
- `pokemon` - Pokemon principales
- `pokemon_type` - Relación Pokemon-Tipos
- `pokemon_move` - Relación Pokemon-Movimientos
- `pokemon_held_item` - Items equipados
- `location_area` - Áreas de ubicación
- `pokemon_encounter` - Encuentros
- `pokemon_flavor_text` - Descripciones (ES/EN)

---

## 🚨 Solución de Problemas

### Error de conexión

Verifica que:
1. Tu instancia AWS RDS esté activa
2. Las credenciales en `.env` sean correctas
3. Los Security Groups permitan tu IP

### El seeder está muy lento

Es normal. PokéAPI tiene rate limiting. El seeder:
- Hace ~100ms entre requests
- Reintenta automáticamente si falla
- Muestra progreso en tiempo real

### Quiero reiniciar desde cero

Conéctate a tu base de datos y ejecuta:

```sql
TRUNCATE TABLE pokemon_flavor_text CASCADE;
TRUNCATE TABLE pokemon_encounter CASCADE;
TRUNCATE TABLE pokemon_held_item CASCADE;
TRUNCATE TABLE pokemon_move CASCADE;
TRUNCATE TABLE pokemon_type CASCADE;
TRUNCATE TABLE pokemon CASCADE;
TRUNCATE TABLE move CASCADE;
TRUNCATE TABLE item CASCADE;
TRUNCATE TABLE location_area CASCADE;
TRUNCATE TABLE version CASCADE;
TRUNCATE TABLE version_group CASCADE;
TRUNCATE TABLE generation CASCADE;
TRUNCATE TABLE type CASCADE;
```

Luego ejecuta el seeder de nuevo.

---

## 🎯 Recomendaciones

| Entorno | Comando | Tiempo | Pokemon |
|---------|---------|--------|---------|
| **Desarrollo** | `npm run seed:complete:gen1` | 15 min | 151 |
| **Testing** | `npm run seed:complete` | 45 min | 386 |
| **Producción** | `npm run seed:complete:full` | 2-4 hrs | 1025+ |

---

## 📚 Recursos

- **PokéAPI Docs**: https://pokeapi.co/docs/v2
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Guía Completa**: [SEEDER_GUIDE.md](./SEEDER_GUIDE.md)

---

## ✅ Checklist de Uso

- [ ] Instalar dependencias (`npm install`)
- [ ] Configurar `.env` con credenciales de base de datos
- [ ] Ejecutar seeder (`npm run seed:complete`)
- [ ] Verificar datos (`npm run query:stats`)
- [ ] Conectar tu aplicación NestJS a la base de datos

---

**¡Listo para desarrollar tu Pokédex!** 🚀
