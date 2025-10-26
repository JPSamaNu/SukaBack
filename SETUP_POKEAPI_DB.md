# 🎮 Guía: Clonar y Personalizar Base de Datos PokeAPI

## 📌 Objetivo
Obtener la base de datos oficial de PokeAPI y personalizarla para tus proyectos.

---

## ✅ **OPCIÓN 1: Docker Local + Dump (RECOMENDADO)**

### Ventajas:
- ✅ Base de datos oficial completa
- ✅ Datos validados y correctos
- ✅ Actualizaciones fáciles
- ✅ 100% personalizable
- ✅ Control total del schema

### Pasos:

#### 1️⃣ Instalar Docker Desktop
- Descargar: https://www.docker.com/products/docker-desktop/
- Instalar y reiniciar Windows
- Verificar: `docker --version`

#### 2️⃣ Levantar PokeAPI oficial localmente

```powershell
# Crear carpeta temporal
cd $env:USERPROFILE\Desktop
git clone --recurse-submodules https://github.com/PokeAPI/pokeapi.git
cd pokeapi

# Levantar con Docker Compose
docker compose up -d

# Esperar 5-10 minutos mientras construye la base de datos
docker compose logs -f app
```

**Cuando veas**: `"from data.v2.build import build_all; build_all()"` completado, la DB está lista.

#### 3️⃣ Verificar que funciona

```powershell
# La API debe responder
curl http://localhost/api/v2/pokemon/pikachu
```

#### 4️⃣ Exportar la base de datos completa

```powershell
# Dump completo de PostgreSQL
docker compose exec -T db pg_dump -U pokeapi -d pokeapi --clean --if-exists > pokeapi_complete.sql

# El archivo estará en: C:\Users\Teddy\Desktop\pokeapi\pokeapi_complete.sql
```

#### 5️⃣ Importar a tu AWS RDS

```powershell
# Método 1: Directo desde PowerShell (requiere psql instalado)
$env:PGPASSWORD="tu_password"
psql -h sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com -U suka -d sukadb -f pokeapi_complete.sql

# Método 2: Desde WSL/Git Bash (más confiable)
# export PGPASSWORD="tu_password"
# psql -h sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com -U suka -d sukadb -f pokeapi_complete.sql
```

#### 6️⃣ Verificar en AWS RDS

```powershell
# Crear script de verificación
cd C:\Users\Teddy\Desktop\SukaDex\SukaBack
node utils/pokemon-query.js
```

Deberías ver **1025 Pokemon** cargados.

---

## ✅ **OPCIÓN 2: CSV Import (Más rápido, menos dependencias)**

Si no quieres usar Docker:

#### 1️⃣ Descargar CSV files del repo oficial

```powershell
# Clonar solo los datos (sin docker)
cd $env:USERPROFILE\Desktop
git clone https://github.com/PokeAPI/pokeapi.git --depth 1
cd pokeapi/data/v2/csv
```

#### 2️⃣ Crear script de importación CSV

Voy a crear un script Node.js que importe los CSV a PostgreSQL.

---

## 🔧 **Personalización Post-Importación**

Una vez tengas la base de datos:

### 1. Añadir tus tablas personalizadas

```sql
-- Ejemplo: Sistema de favoritos de usuarios
CREATE TABLE user_favorites (
  user_id INTEGER NOT NULL,
  pokemon_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, pokemon_id),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon_v2_pokemon(id)
);

-- Ejemplo: Teams de Pokemon
CREATE TABLE user_teams (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id INTEGER REFERENCES user_teams(id),
  pokemon_id INTEGER REFERENCES pokemon_v2_pokemon(id),
  position INTEGER,
  nickname VARCHAR(50),
  PRIMARY KEY (team_id, position)
);
```

### 2. Mantener sincronizado con NestJS

```typescript
// Usar TypeORM entities para tus tablas custom
// Las tablas de PokeAPI dejadas como raw queries o vistas

@Entity('user_favorites')
export class UserFavorite {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  pokemon_id: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;
}
```

---

## 📊 **Estructura Final Recomendada**

```
Tu Base de Datos AWS RDS:
├── pokemon_v2_*           ← Tablas de PokeAPI (1025 Pokemon, moves, etc.)
├── user_favorites         ← Tu tabla custom
├── user_teams             ← Tu tabla custom
├── team_members           ← Tu tabla custom
├── battle_history         ← Tu tabla custom (ejemplo)
└── custom_pokemon_stats   ← Tu tabla custom (ejemplo)
```

**Ventajas:**
- ✅ Datos oficiales sin mantener
- ✅ Tus features sin conflictos
- ✅ Actualizaciones fáciles (nuevo dump cuando salga Gen 10)

---

## 🔄 **Actualizaciones Futuras**

Cuando salga una nueva generación:

```powershell
# 1. Levantar Docker de nuevo
cd pokeapi
docker compose up -d

# 2. Esperar que cargue nuevos datos
docker compose logs -f app

# 3. Dump solo de las tablas de PokeAPI
docker compose exec -T db pg_dump -U pokeapi -d pokeapi -t 'pokemon_v2_*' > update.sql

# 4. Aplicar en AWS RDS (sin borrar tus tablas custom)
psql -h sukadb... -U suka -d sukadb -f update.sql
```

---

## 🚀 **Próximos Pasos**

1. ✅ Instalar Docker Desktop
2. ✅ Ejecutar pasos 1-6 de Opción 1
3. ✅ Crear tus tablas personalizadas
4. ✅ Integrar con NestJS/TypeORM

¿Necesitas ayuda con algún paso específico?
