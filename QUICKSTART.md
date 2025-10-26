# 🚀 Quick Start - Seeder de PokéAPI

## Pasos para poblar tu base de datos

### 1️⃣ Verificar configuración

Asegúrate de que tu archivo `.env` esté configurado:

```env
DATABASE_URL=postgresql://suka:SukaBliat123@sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com:5432/sukadb
```

### 2️⃣ Ejecutar el seeder

Elige una opción según tu necesidad:

#### 🔹 Opción A: Desarrollo rápido (15 min)
Solo Generación 1 (151 Pokemon de Kanto)
```bash
npm run seed:complete:gen1
```

#### 🔹 Opción B: Testing completo (45 min)
Generaciones 1-3 (386 Pokemon: Kanto, Johto, Hoenn)
```bash
npm run seed:complete
```

#### 🔹 Opción C: Producción (2-4 horas)
TODOS los Pokemon (1025+)
```bash
npm run seed:complete:full
```

### 3️⃣ Verificar resultados

```bash
npm run query:stats
```

Deberías ver algo como:

```
📊 Estadísticas de la Base de Datos Pokemon

Pokemon              : 151
Tipos                : 21
Movimientos          : 919
Items                : 2180
Generaciones         : 9
Versiones            : 47
```

### 4️⃣ Consultar datos

```bash
# Ver Pikachu
npm run query pokemon 25

# Buscar por nombre
npm run query search charizard

# Ver todos los tipos
npm run query types
```

---

## 📊 ¿Qué se está cargando?

Durante el seeder verás progreso en tiempo real:

```
[2.3s] 🌱 Seeding generations... (9)
[5.1s] ✅ Generations seeded { count: { count: '9' } }
[8.4s] 🌱 Seeding version groups...
[45.2s] ✅ Version groups seeded { count: { count: '30' } }
[48.1s] 🌱 Seeding types...
[52.3s] ✅ Types seeded { count: { count: '21' } }
[55.0s] 🌱 Seeding moves (all details)...
[180.5s] Processing moves (500)
[320.2s] ✅ Moves seeded { count: { count: '919' } }
...
```

---

## 🎯 Recomendaciones por Caso de Uso

| Escenario | Comando | Tiempo | Pokemon |
|-----------|---------|--------|---------|
| **Primer prueba / Demo** | `npm run seed:complete:gen1` | 15 min | 151 |
| **Desarrollo local** | `npm run seed:complete:gen1` | 15 min | 151 |
| **Testing / Staging** | `npm run seed:complete` | 45 min | 386 |
| **Producción completa** | `npm run seed:complete:full` | 2-4 hrs | 1025+ |

---

## ⚠️ Notas Importantes

1. **El seeder es idempotente**: Puedes ejecutarlo varias veces sin problema. Usa UPSERTS.

2. **Rate limiting**: PokéAPI limita requests. El seeder espera 100ms entre cada uno.

3. **Progreso guardado**: Si se interrumpe, los datos ya cargados quedan guardados.

4. **AWS RDS**: Asegúrate de que tu IP esté en los Security Groups.

---

## 🔧 Troubleshooting Rápido

### ❌ Error: "Connection refused"
```bash
# Verifica que la base de datos esté accesible
psql postgresql://suka:SukaBliat123@sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com:5432/sukadb
```

### ❌ Error: "Rate limited (429)"
No te preocupes, el seeder espera automáticamente y reintenta.

### ❌ Quiero limpiar y empezar de nuevo
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

---

## 📚 Más Información

- **Guía Completa**: [SEEDER_GUIDE.md](./SEEDER_GUIDE.md)
- **README del Seeder**: [README_SEEDER.md](./README_SEEDER.md)
- **PokéAPI Docs**: https://pokeapi.co/docs/v2

---

**¡Listo! Ahora puedes empezar a desarrollar con datos reales de Pokemon!** 🎮
