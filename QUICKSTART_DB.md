# 🚀 Quick Start: Configuración Base de Datos PokeAPI

## TL;DR - Opción Recomendada (20 minutos)

```powershell
# 1. Instalar Docker Desktop
# https://www.docker.com/products/docker-desktop/

# 2. Clonar y levantar PokeAPI
cd $env:USERPROFILE\Desktop
git clone --recurse-submodules https://github.com/PokeAPI/pokeapi.git
cd pokeapi
docker compose up -d

# 3. Esperar 10-15 min, luego exportar
docker compose exec -T db pg_dump -U pokeapi -d pokeapi --clean --if-exists > pokeapi_complete.sql

# 4. Importar a AWS RDS
$env:PGPASSWORD="tu_password"
psql -h sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com -U suka -d sukadb -f pokeapi_complete.sql

# 5. Añadir tablas custom
cd C:\Users\Teddy\Desktop\SukaDex\SukaBack
npm run db:custom-tables
```

✅ **LISTO!** Base de datos completa con 1025 Pokemon + tus tablas personalizadas.

---

## 📚 Scripts Disponibles

### Configuración
```powershell
npm run db:setup-wizard     # Asistente interactivo
npm run db:custom-tables    # Crear tablas personalizadas
npm run db:test             # Probar conexión
```

### Importación
```powershell
npm run db:import-csv       # Importar desde CSV (sin Docker)
npm run seed:complete:full  # Seeder desde API (muy lento)
```

### Monitoreo
```powershell
npm run db:monitor          # Monitorear progreso en tiempo real
npm run query               # Ver estadísticas
```

### Seeder por Generación (solo si no usas Docker)
```powershell
npm run seed:complete:gen1  # Generación 1 (151 Pokemon)
npm run seed:complete:gen2  # Generación 2 (100 Pokemon)
# ... gen3 a gen9
```

---

## 📊 Tablas Personalizadas Incluidas

Al ejecutar `npm run db:custom-tables` se crean:

- `user_favorites` - Pokemon favoritos de usuarios
- `user_teams` - Equipos de Pokemon
- `team_members` - Miembros de equipos (hasta 6 Pokemon)
- `battle_history` - Historial de batallas
- `pokemon_ratings` - Ratings/reviews de Pokemon
- `custom_pokemon_nicknames` - Apodos personalizados
- `user_achievements` - Sistema de logros
- `pokemon_encounters_log` - Log de encuentros/capturas

---

## 🔧 Personalizar Más

Edita `database/create-custom-tables.js` para añadir tus propias tablas.

---

## 📖 Documentación Completa

- `SETUP_POKEAPI_DB.md` - Guía detallada paso a paso
- `BEST_STRATEGY.md` - Comparación de opciones
- `README.md` - Documentación del proyecto

---

## 🆘 Troubleshooting

### "Docker no encontrado"
- Instala Docker Desktop: https://www.docker.com/products/docker-desktop/

### "psql no es un comando reconocido"
- Instala PostgreSQL client: https://www.postgresql.org/download/windows/
- O usa Git Bash / WSL

### "Error de conexión a AWS RDS"
- Verifica tu `DATABASE_URL` en `.env`
- Verifica security groups en AWS
- Prueba con: `npm run db:test`

---

## ✅ Verificación

Después de importar, verifica:

```powershell
npm run query
```

Deberías ver:
```
Pokemon              : 1025
Tipos                : 21
Movimientos          : 937
Items                : 2180
Generaciones         : 9
```

---

¡Listo para desarrollar! 🎮
