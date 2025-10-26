# 🎮 Seeder por Generaciones - Guía Rápida

## 🚀 Nueva Estrategia: Cargar por Generaciones

El seeder ahora está optimizado para cargar Pokemon **por generaciones individuales**, lo que te da:

✅ **Más rápido**: Carga solo lo que necesitas  
✅ **Más seguro**: Si algo falla, no pierdes todo el progreso  
✅ **Más flexible**: Elige qué generaciones cargar  
✅ **Idempotente**: Detecta automáticamente lo que ya está cargado  

---

## 📋 Comandos Disponibles

### Cargar Generaciones Individuales

```bash
# Generación 1 (Kanto - 151 Pokemon) ⭐ Recomendado para empezar
npm run seed:complete:gen1

# Generación 2 (Johto - 100 Pokemon)
npm run seed:complete:gen2

# Generación 3 (Hoenn - 135 Pokemon)
npm run seed:complete:gen3

# Generación 4 (Sinnoh - 107 Pokemon)
npm run seed:complete:gen4

# Generación 5 (Unova - 156 Pokemon)
npm run seed:complete:gen5

# Generación 6 (Kalos - 72 Pokemon)
npm run seed:complete:gen6

# Generación 7 (Alola - 88 Pokemon)
npm run seed:complete:gen7

# Generación 8 (Galar - 96 Pokemon)
npm run seed:complete:gen8

# Generación 9 (Paldea - 120 Pokemon)
npm run seed:complete:gen9
```

### Cargar Múltiples Generaciones

```bash
# Generaciones 1-3 (Default) - 386 Pokemon
npm run seed:complete

# Generaciones 1-3 (explícito)
npm run seed:gens:1-3

# Generaciones 4-6
npm run seed:gens:4-6

# Generaciones 7-9
npm run seed:gens:7-9

# TODAS las generaciones (1-9) - 1025 Pokemon
npm run seed:complete:full
```

### Ver Ayuda

```bash
npm run seed:help
```

---

## ⏱️ Tiempos Estimados por Generación

| Generación | Region | Pokemon | Tiempo Aprox. |
|------------|--------|---------|---------------|
| Gen 1 | Kanto | 151 | 15-20 min |
| Gen 2 | Johto | 100 | 10-15 min |
| Gen 3 | Hoenn | 135 | 12-18 min |
| Gen 4 | Sinnoh | 107 | 10-15 min |
| Gen 5 | Unova | 156 | 15-20 min |
| Gen 6 | Kalos | 72 | 8-12 min |
| Gen 7 | Alola | 88 | 10-15 min |
| Gen 8 | Galar | 96 | 10-15 min |
| Gen 9 | Paldea | 120 | 12-18 min |

**Total (todas)**: 2-3 horas

---

## 🎯 Estrategias Recomendadas

### 🔹 Primera Vez / Desarrollo

Carga solo la Gen 1 para probar rápido:

```bash
npm run seed:complete:gen1
```

Luego, si quieres más:

```bash
npm run seed:complete:gen2
npm run seed:complete:gen3
```

### 🔹 Testing / Demo

Carga las primeras 3 generaciones (clásicas):

```bash
npm run seed:gens:1-3
```

O ejecuta una por una:

```bash
npm run seed:complete:gen1
npm run seed:complete:gen2
npm run seed:complete:gen3
```

### 🔹 Producción Completa

Opción 1: Todas a la vez (lento, 2-3 horas)
```bash
npm run seed:complete:full
```

Opción 2: Por bloques (recomendado)
```bash
npm run seed:gens:1-3    # ~45 min
npm run seed:gens:4-6    # ~35 min
npm run seed:gens:7-9    # ~40 min
```

---

## ✨ Características Inteligentes

### 1. Detección Automática

El seeder **detecta automáticamente** qué generaciones ya están cargadas:

```bash
npm run seed:complete:gen1

# Primera vez:
🎮 GENERACIÓN 1: KANTO
📍 Pokemon #1 - #151 (151 Pokemon)
⏳ Cargando...

# Segunda vez (ya cargada):
✅ Generación 1 ya está completamente cargada (151 Pokemon)
⏭️  Saltando a la siguiente...
```

### 2. Recuperación de Errores

Si algo falla a mitad de una generación, simplemente vuelve a ejecutar:

```bash
npm run seed:complete:gen3

# Se interrumpió en el Pokemon #300
📊 Generación 3 parcialmente cargada (48/135)
⚡ Continuando desde donde se quedó...
```

### 3. Datos Base (Una Sola Vez)

Los datos base (tipos, moves, items) se cargan **solo la primera vez**:

```bash
# Primera generación que cargues:
📦 Cargando datos base (generaciones, tipos, moves, items)...

# Siguientes generaciones:
✅ Datos base ya cargados, continuando con Pokemon...
```

---

## 📊 Verificar Progreso

En cualquier momento, verifica qué tienes cargado:

```bash
npm run query:stats
```

Ejemplo de output:

```
📊 Estadísticas de la Base de Datos Pokemon

Pokemon              : 386    # Gen 1-3 completas
Tipos                : 21
Movimientos          : 919
Items                : 2180
Generaciones         : 9
Versiones            : 47
```

---

## 🛠️ Uso Avanzado (CLI Directo)

### Una generación específica

```bash
node seeders/pokeapi-complete.js --gen=5
```

### Múltiples generaciones

```bash
node seeders/pokeapi-complete.js --gens=1,2,3,4,5
node seeders/pokeapi-complete.js --gens=7,8,9
```

### Todas las generaciones

```bash
node seeders/pokeapi-complete.js --full
```

### Ayuda

```bash
node seeders/pokeapi-complete.js --help
```

---

## 💡 Consejos

1. **Empieza con Gen 1**: Es rápida y te da suficientes Pokemon para probar

2. **Carga por bloques**: En vez de `--full`, carga por bloques de 3 generaciones

3. **Verifica después de cada gen**: 
   ```bash
   npm run seed:complete:gen1
   npm run query:stats
   npm run query pokemon 25  # Ver Pikachu
   ```

4. **Si algo falla**: Solo vuelve a ejecutar la misma generación, continuará desde donde quedó

---

## 🚨 Solución de Problemas

### ❌ Error: "Connection refused"

Verifica tu conexión:
```bash
npm run db:test
```

### ❌ Una generación falla a la mitad

Simplemente vuelve a ejecutar:
```bash
npm run seed:complete:gen3  # Continuará desde donde quedó
```

### ❌ Quiero borrar una generación y volverla a cargar

```sql
-- En tu cliente SQL
DELETE FROM pokemon_flavor_text WHERE pokemon_id BETWEEN 1 AND 151;
DELETE FROM pokemon_encounter WHERE pokemon_id BETWEEN 1 AND 151;
DELETE FROM pokemon_held_item WHERE pokemon_id BETWEEN 1 AND 151;
DELETE FROM pokemon_move WHERE pokemon_id BETWEEN 1 AND 151;
DELETE FROM pokemon_type WHERE pokemon_id BETWEEN 1 AND 151;
DELETE FROM pokemon WHERE id BETWEEN 1 AND 151;

-- Luego:
npm run seed:complete:gen1
```

---

## 🎉 Ejemplo de Workflow Completo

```bash
# 1. Verificar conexión
npm run db:test

# 2. Cargar Gen 1 (15 min)
npm run seed:complete:gen1

# 3. Verificar
npm run query:stats

# 4. Probar un Pokemon
npm run query pokemon 25

# 5. Si todo está bien, continuar con Gen 2 (10 min)
npm run seed:complete:gen2

# 6. Y así sucesivamente...
npm run seed:complete:gen3
npm run seed:complete:gen4
# ...
```

---

## 📈 Progreso Recomendado

| Día | Generaciones | Total Pokemon | Tiempo |
|-----|--------------|---------------|--------|
| Día 1 | Gen 1 | 151 | 15 min |
| Día 2 | Gen 2-3 | 386 | 25 min |
| Día 3 | Gen 4-5 | 649 | 30 min |
| Día 4 | Gen 6-7 | 809 | 25 min |
| Día 5 | Gen 8-9 | 1025 | 30 min |

**Total**: ~2 horas repartidas en 5 días ✅

O todo de una vez si tienes tiempo:
```bash
npm run seed:complete:full  # 2-3 horas
```

---

**¡Ahora tienes control total sobre qué cargar y cuándo!** 🚀
