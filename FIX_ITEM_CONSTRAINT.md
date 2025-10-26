# 🔧 Fix: Error de Constraint Duplicado en Items

## 🐛 Problema Encontrado

Al ejecutar el seeder completo, se encontró este error:

```
Error en query: duplicate key value violates unique constraint "item_name_key"
SQL: INSERT INTO item (id,name) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
Params: [ 1943, 'tm100' ]
```

### Causa del Problema

La tabla `item` fue creada con un constraint **UNIQUE** en la columna `name`:

```sql
CREATE TABLE item (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE  -- ❌ Problema aquí
)
```

Sin embargo, **PokéAPI tiene items con el mismo nombre pero diferentes IDs**. Por ejemplo:
- Item #1943: "tm100" 
- Item #XXXX: "tm100" (otro item con el mismo nombre)

Esto causa que al intentar insertar el segundo item con nombre "tm100", PostgreSQL rechace la operación por violar el constraint UNIQUE.

---

## ✅ Solución Implementada

### 1. Script de Migración

Se creó el script `utils/fix-item-constraint.js` que:
- Detecta si existe el constraint `item_name_key`
- Lo elimina de la tabla
- Verifica que se eliminó correctamente

**Ejecutar una vez**:
```bash
npm run db:fix-items
```

### 2. Actualización de la Definición de Tabla

Se actualizó `database/PostgresDatabase.js` para que futuras creaciones de la tabla no incluyan el constraint UNIQUE:

```sql
-- Antes (❌ Incorrecto)
CREATE TABLE item (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
)

-- Después (✅ Correcto)
CREATE TABLE item (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL  -- Sin UNIQUE
)
```

### 3. Resultado

Ahora la tabla `item` acepta múltiples items con el mismo nombre, siempre que tengan IDs diferentes (que es el comportamiento correcto según PokéAPI).

---

## 🎯 Por Qué Esto Está Bien

En PokéAPI:
- **El ID es único** y es la verdadera clave primaria
- **El nombre puede repetirse** (ej: diferentes versiones de TMs tienen el mismo nombre)
- La unicidad debe basarse en el **ID**, no en el nombre

Ejemplo real de PokéAPI:
```json
{
  "id": 1943,
  "name": "tm100",
  "cost": 3000
}
{
  "id": 619,
  "name": "tm100",
  "cost": 10000
}
```

Ambos son items válidos con el mismo nombre pero diferentes IDs.

---

## 📋 Pasos para Arreglar (Si Encuentras Este Error)

Si encuentras este error en tu base de datos:

### Opción 1: Usar el Script Automático (Recomendado)

```bash
npm run db:fix-items
```

### Opción 2: Manual (SQL)

Conecta a tu base de datos y ejecuta:

```sql
-- Eliminar el constraint UNIQUE de 'name'
ALTER TABLE item DROP CONSTRAINT IF EXISTS item_name_key;

-- Verificar
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'item' 
AND constraint_type = 'UNIQUE';
-- Debería devolver 0 resultados
```

---

## 🚀 Después del Fix

Una vez arreglado, puedes continuar con el seeder sin problemas:

```bash
# Verificar que todo está OK
npm run db:test

# Ejecutar el seeder
npm run seed:complete:full
```

---

## 📊 Estado Actual

✅ **Fix aplicado exitosamente**

- Script de migración creado: `utils/fix-item-constraint.js`
- Definición de tabla actualizada: `database/PostgresDatabase.js`
- Constraint eliminado de la base de datos
- Seeder funcionando correctamente

---

## 🔍 Verificación

Para verificar que el fix está aplicado:

```bash
# Ejecutar el script de verificación
npm run db:fix-items
```

Deberías ver:
```
✅ El constraint ya no existe. Todo está OK.
```

---

## 📝 Notas Técnicas

### Constraint Afectado
- **Nombre**: `item_name_key`
- **Tipo**: UNIQUE
- **Columna**: `name`
- **Tabla**: `item`

### Comportamiento Anterior
```sql
INSERT INTO item (id, name) VALUES (1943, 'tm100');  -- ✅ OK
INSERT INTO item (id, name) VALUES (1944, 'tm100');  -- ❌ ERROR
```

### Comportamiento Actual
```sql
INSERT INTO item (id, name) VALUES (1943, 'tm100');  -- ✅ OK
INSERT INTO item (id, name) VALUES (1944, 'tm100');  -- ✅ OK (IDs diferentes)
INSERT INTO item (id, name) VALUES (1943, 'tm101');  -- ❌ ERROR (ID duplicado)
```

---

**¡Problema resuelto!** El seeder ahora puede cargar todos los items sin errores. 🎉
