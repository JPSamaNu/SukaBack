# 🚀 Guía Completa del Seeder de PokéAPI v2 para SukaBack

Seeder integral e idempotente que puebla tu base de datos PostgreSQL (AWS RDS) con **TODOS** los datos relevantes de PokéAPI v2.

## ✨ Características

### ✅ Datos Incluidos
- **Generaciones**: Todas las generaciones (1-9+)
- **Version Groups**: Todos los grupos de versiones
- **Versiones**: Todas las versiones de juegos Pokemon
- **Tipos**: Todos los tipos de Pokemon (21)
- **Movimientos**: TODOS los moves con detalles completos (919+)
- **Items**: Todos los items (2000+)
- **Pokemon**: Todos los Pokemon (1-1025+)
  - Datos básicos (altura, peso, experiencia base, sprite)
  - Tipos por Pokemon
  - Movimientos por version_group
  - Items equipados por versión
  - Encuentros por versión y área
  - Flavor texts (descripciones) en Español e Inglés

### ✅ Características Técnicas
- ✅ **Idempotente**: Usa UPSERTS, puedes ejecutar múltiples veces sin duplicados
- ✅ **Rate Limiting**: Respeta límites de PokéAPI (100ms entre requests)
- ✅ **Reintentos**: 5 reintentos con backoff exponencial
- ✅ **Paginación automática**: Maneja automáticamente endpoints paginados
- ✅ **Manejo robusto de errores**: Continúa ante fallos individuales
- ✅ **Progress tracking**: Muestra progreso en tiempo real
- ✅ **Estadísticas completas**: Resumen detallado al finalizar
- ✅ **Compatible con AWS RDS**: Usa tu configuración de `.env`

---

## 📦 Instalación

Todo está listo. Solo asegúrate de tener las dependencias instaladas:

```bash
npm install
```

---

## 🎯 Uso

### Opción 1: Generaciones 1-3 (Default - Recomendado para empezar)

Carga Pokemon 1-386 (Kanto, Johto, Hoenn) + todos los datos relacionados

```bash
npm run seed:complete
```

**Tiempo estimado**: 30-45 minutos  
**Pokemon**: 386  
**Ideal para**: Desarrollo y pruebas

---

### Opción 2: Generación específica

```bash
# Solo Generación 1 (Kanto - 151 Pokemon)
npm run seed:complete:gen1

# Solo Generación 2 (Johto - 100 Pokemon)
npm run seed:complete:gen2

# Solo Generación 3 (Hoenn - 135 Pokemon)
npm run seed:complete:gen3

# O cualquier generación manualmente
node seeders/pokeapi-complete.js --gen=4
node seeders/pokeapi-complete.js --gen=5
# ... hasta --gen=9
```

**Tiempo estimado**: 10-25 minutos por generación

---

### Opción 3: TODO (Producción)

Carga **TODOS** los Pokemon (1-1025+) + datos completos

```bash
npm run seed:complete:full
```

**⚠️ ADVERTENCIA**:  
- **Tiempo estimado**: 2-4 horas
- **Requests**: ~15,000+
- **Solo para producción o cuando tengas tiempo**

---

## 📊 Datos que se cargan

### Fase 1: Datos Base (Rápido - 5 min)
1. **Generaciones** (9+)
2. **Version Groups** (30+)
3. **Versiones** (47+)
4. **Tipos** (21)
5. **Movimientos** (919+ con detalles completos)
6. **Items** (2000+)

### Fase 2: Pokemon (Lento - Variable)
7. **Pokemon** (depende del rango seleccionado)
   - Datos básicos
   - Tipos
   - Movimientos por versión
   - Items equipados
8. **Encounters** (ubicaciones donde encontrar Pokemon)
9. **Flavor Texts** (descripciones en ES/EN)

---

## 📈 Progreso en Tiempo Real

El seeder muestra progreso constante:

```
[2.3s] 🌱 Seeding generations... (9)
[5.1s] ✅ Generations seeded { count: { count: '9' } }
[8.4s] 🌱 Seeding version groups...
[45.2s] ✅ Version groups seeded { count: { count: '30' } }
[180.5s] Processing Pokemon (150)
...
```

---

## 📊 Estadísticas Finales

Al terminar, verás un resumen completo:

```
============================================================
📊 BASE DE DATOS POKÉMON - ESTADÍSTICAS COMPLETAS
============================================================
🐾 Pokemon:                    386
⚡ Tipos:                       21
🥊 Movimientos:                 919
🎒 Items:                       2180
📖 Pokemon-Movimientos:         45000+
🏷️  Pokemon-Tipos:               520+
💎 Pokemon-Items equipados:     800+
📍 Encuentros registrados:      1200+
🌍 Generaciones:                9
🎮 Grupos de versiones:         30
📀 Versiones:                   47
🇪🇸 Descripciones en Español:   1500+
🇬🇧 Descripciones en Inglés:    2000+
============================================================
📊 Total requests:              8500
⚠️  Total errors:                12
⏱️  Tiempo total:                32.45 minutos
============================================================
```

---

## 🔍 Consultar Datos

Una vez cargados, consulta tu base de datos:

### Desde la terminal

```bash
# Estadísticas generales
npm run query:stats

# Ver un Pokemon específico
npm run query pokemon 25

# Buscar por nombre
npm run query search charizard

# Ver tipos
npm run query types
```

### Queries SQL útiles

Conéctate a tu base de datos con tu cliente SQL favorito (PgAdmin, DBeaver, etc.):

```sql
-- Pokemon por generación
SELECT p.*, g.name as generation 
FROM pokemon p 
JOIN pokemon_species ps ON p.id = ps.id
JOIN generation g ON ps.generation_id = g.id
WHERE g.id = 1
ORDER BY p.id;

-- Movimientos de Pikachu
SELECT m.name, pm.learn_method, pm.level, vg.name as version_group
FROM pokemon_move pm
JOIN move m ON pm.move_id = m.id
JOIN version_group vg ON pm.version_group_id = vg.id
WHERE pm.pokemon_id = 25
ORDER BY pm.level NULLS LAST, m.name;

-- Pokemon de tipo fuego
SELECT p.name, t.name as type
FROM pokemon p
JOIN pokemon_type pt ON p.id = pt.pokemon_id
JOIN type t ON pt.type_id = t.id
WHERE t.name = 'fire'
ORDER BY p.id;

-- Descripciones en español
SELECT p.name, pft.flavor_text, v.name as version
FROM pokemon p
JOIN pokemon_flavor_text pft ON p.id = pft.pokemon_id
JOIN version v ON pft.version_id = v.id
WHERE pft.language = 'es' AND p.id = 25
LIMIT 5;
```

---

## 🔧 Configuración

El seeder usa las variables de entorno de tu archivo `.env`:

```env
# Base de datos PostgreSQL (AWS RDS)
DATABASE_URL=postgresql://suka:SukaBliat123@sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com:5432/sukadb

# O variables individuales
DB_HOST=sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=suka
DB_PASSWORD=SukaBliat123
DB_NAME=sukadb
```

---

## 🚨 Troubleshooting

### Error: Connection refused
→ La base de datos no está accesible. Verifica:
- Que tu instancia AWS RDS esté activa
- Que las credenciales en `.env` sean correctas
- Que los Security Groups permitan tu IP

### Error: Rate limited (429)
→ Normal. El seeder espera automáticamente y reintenta.

### Error: Pokemon not found
→ Algunos IDs no existen. El seeder los salta automáticamente.

### Proceso muy lento
→ Normal para TODOS los Pokemon (2-4 horas). Usa generaciones específicas para más rapidez.

### Quiero reiniciar desde cero

Conéctate a tu base de datos y ejecuta:

```sql
-- Limpiar todas las tablas
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

-- Luego ejecuta el seeder de nuevo
npm run seed:complete
```

---

## 🎯 Recomendaciones

### Para Desarrollo
```bash
# Usa generación 1 (rápido, 10-15 min)
npm run seed:complete:gen1
```

### Para Staging/Testing
```bash
# Usa generaciones 1-3 (moderado, 30-45 min)
npm run seed:complete
```

### Para Producción
```bash
# Usa TODO (lento, 2-4 horas - déjalo corriendo)
npm run seed:complete:full
```

---

## 📋 Estructura de Archivos

```
SukaBack/
├── database/
│   └── PostgresDatabase.js      # Gestor de conexión y tablas
├── seeders/
│   └── pokeapi-complete.js      # Seeder principal
├── utils/
│   └── pokemon-query.js         # Utilidad para consultas
├── .env                         # Configuración (DATABASE_URL)
├── package.json                 # Scripts npm
└── SEEDER_GUIDE.md             # Esta guía
```

---

## 🎉 ¡Listo!

Tu base de datos estará completa y lista para:
- ✅ Conectar con tu aplicación NestJS
- ✅ Endpoints REST/GraphQL
- ✅ Desarrollo de tu Pokedex
- ✅ Análisis de datos

**¡Disfruta tu base de datos completa de Pokemon!** 🚀

---

## 📚 Recursos Adicionales

- **PokéAPI Docs**: https://pokeapi.co/docs/v2
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **AWS RDS**: https://aws.amazon.com/rds/

---

## 🆘 Soporte

Si tienes problemas, revisa:
1. Las credenciales de tu base de datos en `.env`
2. Que tu IP esté en los Security Groups de AWS
3. Los logs del seeder para errores específicos

**¡Happy coding!** 🚀
