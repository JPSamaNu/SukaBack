# 📊 RESUMEN COMPLETO DE DATOS DISPONIBLES EN LA BASE DE DATOS

## ✅ Datos de Especies de Pokémon (pokemon_v2_pokemonspecies)

### Información de Captura y Breeding:
- ✅ **capture_rate**: Tasa de captura (0-255)
  - Ejemplo: Pikachu = 190
- ✅ **base_happiness**: Felicidad base (0-255)
  - Ejemplo: Pikachu = 70
- ✅ **gender_rate**: Distribución de género (-1 a 8)
  - -1 = Sin género
  - 0 = 100% Macho
  - 8 = 100% Hembra
  - 4 = 50% Macho / 50% Hembra (Pikachu)
- ✅ **hatch_counter**: Pasos para eclosionar (multiplicar por 256)
  - Ejemplo: Pikachu = 10 (2,560 pasos)

### Información de Evolución:
- ✅ **evolution_chain_id**: ID de la cadena evolutiva
- ✅ **evolves_from_species_id**: De qué Pokémon evoluciona
- ✅ **is_baby**: Si es un Pokémon bebé
- ✅ **forms_switchable**: Si puede cambiar de forma

### Clasificación:
- ✅ **is_legendary**: Si es legendario
- ✅ **is_mythical**: Si es mítico
- ✅ **generation_id**: Generación de introducción
- ✅ **growth_rate_id**: Ritmo de crecimiento (slow, medium, fast, etc.)
- ✅ **pokemon_color_id**: Color del Pokémon
- ✅ **pokemon_habitat_id**: Hábitat natural
- ✅ **pokemon_shape_id**: Forma/silueta
- ✅ **has_gender_differences**: Si tiene diferencias visuales por género

---

## ✅ Grupos de Huevo (pokemon_v2_pokemonegggroup)

- ✅ Tabla: **pokemon_v2_egggroup**
- ✅ Relación: **pokemon_v2_pokemonegggroup**
- ✅ Grupos disponibles:
  - ground, fairy, water1, water2, water3
  - bug, flying, field, monster, dragon
  - plant, human-like, mineral, amorphous
  - ditto, no-eggs

Ejemplo Pikachu:
- Ground (Campo)
- Fairy (Hada)

---

## ✅ Estadísticas Base (pokemon_v2_pokemonstat)

- ✅ **base_stat**: Valor base de la estadística (0-255)
- ✅ **effort**: Puntos de esfuerzo (EVs) que otorga

Stats disponibles:
1. HP
2. Attack
3. Defense
4. Special Attack
5. Special Defense
6. Speed

Ejemplo Pikachu:
- HP: 35
- Attack: 55
- Defense: 40
- Special Attack: 50
- Special Defense: 50
- Speed: 90 (otorga 2 EVs de velocidad)

---

## ✅ Habilidades (pokemon_v2_pokemonability)

- ✅ **ability_id**: ID de la habilidad
- ✅ **is_hidden**: Si es habilidad oculta
- ✅ **slot**: Posición de la habilidad (1, 2, o 3 para oculta)

Ejemplo Pikachu:
- Slot 1: Static (normal)
- Slot 3: Lightning Rod (oculta)

---

## ✅ Evoluciones (pokemon_v2_pokemonevolution)

### Condiciones de Evolución:
- ✅ **min_level**: Nivel mínimo requerido
- ✅ **min_happiness**: Felicidad mínima
- ✅ **min_beauty**: Belleza mínima
- ✅ **min_affection**: Afecto mínimo
- ✅ **evolution_trigger_id**: Método de evolución (level-up, use-item, trade, shed)
- ✅ **evolution_item_id**: Ítem requerido (piedras, etc.)
- ✅ **held_item_id**: Ítem que debe llevar equipado
- ✅ **time_of_day**: Momento del día ('day', 'night', '')
- ✅ **location_id**: Ubicación específica requerida
- ✅ **region_id**: Región específica requerida
- ✅ **known_move_id**: Movimiento que debe conocer
- ✅ **known_move_type_id**: Tipo de movimiento que debe conocer
- ✅ **party_species_id**: Pokémon que debe estar en el equipo
- ✅ **party_type_id**: Tipo de Pokémon en el equipo
- ✅ **trade_species_id**: Pokémon por el que debe intercambiarse
- ✅ **gender_id**: Género requerido
- ✅ **relative_physical_stats**: Relación entre stats físicas
- ✅ **needs_overworld_rain**: Si necesita lluvia
- ✅ **turn_upside_down**: Si necesita voltear el dispositivo

Ejemplo Pichu → Pikachu:
- Trigger: level-up
- Min happiness: 220

Ejemplo Pikachu → Raichu:
- Trigger: use-item
- Item: Thunder Stone (ID 82)

---

## ✅ Ritmos de Crecimiento (pokemon_v2_growthrate)

1. slow (1,250,000 exp)
2. medium (1,000,000 exp) ← Pikachu usa este
3. fast (800,000 exp)
4. medium-slow (1,059,860 exp)
5. slow-then-very-fast (600,000 exp)
6. fast-then-very-slow (1,640,000 exp)

---

## ✅ Apariencia

### Colores (pokemon_v2_pokemoncolor):
- black, blue, brown, gray, green, pink, purple, red, white, yellow

### Hábitats (pokemon_v2_pokemonhabitat):
- cave, forest, grassland, mountain, rare, rough-terrain, sea, urban, waters-edge

### Formas (pokemon_v2_pokemonshape):
- ball, squiggle, fish, arms, blob, upright, legs, quadruped, wings, tentacles, heads, humanoid, bug-wings, armor

Ejemplo Pikachu:
- Color: yellow
- Hábitat: forest
- Forma: quadruped (cuadrúpedo)

---

## ✅ Formas de Pokémon (pokemon_v2_pokemonform)

- ✅ **form_name**: Nombre de la forma
- ✅ **is_default**: Si es la forma por defecto
- ✅ **is_battle_only**: Si solo existe en batalla
- ✅ **is_mega**: Si es una mega-evolución
- ✅ **form_order**: Orden de la forma

---

## ✅ Versiones y Juegos (pokemon_v2_version / pokemon_v2_versiongroup)

- ✅ **Legends Z-A** está disponible (ID: 47, Version Group: 30)
- ✅ Generación 9
- ✅ Pokédex: Lumiose City (230 Pokémon)

---

## ⚠️ Datos NO Disponibles (aún)

### Ubicaciones de Legends Z-A:
- ❌ **Encounters**: 0 encuentros registrados
  - Esto es normal, el juego aún no ha sido lanzado
  - Los encuentros se agregan cuando el juego está disponible

---

## 📝 Resumen de Ejemplo: Pikachu (#25)

```json
{
  "species": {
    "capture_rate": 190,
    "base_happiness": 70,
    "hatch_counter": 10,
    "gender_distribution": "50% Macho / 50% Hembra",
    "growth_rate": "medium",
    "is_legendary": false,
    "is_mythical": false,
    "generation": 1
  },
  "egg_groups": ["ground", "fairy"],
  "base_stats": {
    "hp": 35,
    "attack": 55,
    "defense": 40,
    "special_attack": 50,
    "special_defense": 50,
    "speed": 90
  },
  "abilities": {
    "normal": "static",
    "hidden": "lightning-rod"
  },
  "evolution": {
    "from": "pichu (220 happiness)",
    "to": "raichu (Thunder Stone)"
  },
  "appearance": {
    "color": "yellow",
    "habitat": "forest",
    "shape": "quadruped"
  }
}
```

---

## 🎯 Conclusión

La base de datos de PokeAPI contiene **TODOS** los datos necesarios para mostrar:
- ✅ Ratio de captura
- ✅ Grupos de huevo
- ✅ Pasos para eclosionar
- ✅ Distribución de género
- ✅ Ritmo de crecimiento
- ✅ Estadísticas base y EVs
- ✅ Habilidades (normales y ocultas)
- ✅ Cadenas evolutivas completas con todas las condiciones
- ✅ Color, hábitat y forma
- ✅ Clasificación (legendario, mítico, bebé)

La única información que falta son las **ubicaciones para Legends Z-A**, lo cual es esperado ya que el juego aún no ha sido lanzado oficialmente.
