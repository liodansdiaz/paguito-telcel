# 🗄️ Guía de Migraciones: Render + Neon

## Arquitectura

```
┌─────────────────────┐
│  RENDER (Backend)   │ ← Servidor Node.js con Prisma CLI
│  - Express          │
│  - Prisma Client    │
└──────────┬──────────┘
           │
           │ DATABASE_URL (conexión remota HTTPS)
           │
           ▼
┌─────────────────────┐
│  NEON (PostgreSQL)  │ ← Base de datos serverless
│  - Tablas           │
│  - Migraciones      │
└─────────────────────┘
```

**Render y Neon están en servidores separados** y se conectan vía internet usando `DATABASE_URL`.

---

## ✅ Configuración Automática (Recomendado)

### Opción 1: Usar `render.yaml`

Ya existe un archivo `render.yaml` en la raíz del proyecto que configura:

```yaml
startCommand: cd backend && npx prisma migrate deploy && npm start
```

**Esto ejecuta automáticamente:**
1. `npx prisma migrate deploy` → Se conecta a Neon y aplica migraciones pendientes
2. `npm start` → Inicia el servidor Express

**Para activarlo:**
- Render detecta automáticamente `render.yaml` en el repositorio
- En el próximo deploy, usará esta configuración
- **No necesitas configurar nada manualmente en el dashboard**

### Opción 2: Configurar manualmente en Render Dashboard

Si preferís configurar manualmente (sin `render.yaml`):

1. Ir a **Render Dashboard → Tu servicio → Settings**
2. Editar **Build & Deploy**:
   - **Build Command:** `cd backend && npm install && npx prisma generate && npm run build`
   - **Start Command:** `cd backend && npx prisma migrate deploy && npm start`
3. Guardar (esto hará un redeploy automático)

---

## 🔄 Proceso de Migraciones en cada Deploy

Cuando hacés push a `main`:

```bash
1. GitHub detecta el push
2. Render inicia el build:
   ├── Clona el repositorio
   ├── Ejecuta: npm install (instala dependencias)
   ├── Ejecuta: npx prisma generate (genera cliente de Prisma)
   └── Ejecuta: npm run build (compila TypeScript)

3. Render inicia el servidor:
   ├── Ejecuta: npx prisma migrate deploy
   │   ├── Lee DATABASE_URL (apunta a Neon)
   │   ├── Se conecta a Neon por internet
   │   ├── Consulta tabla _prisma_migrations
   │   ├── Compara con migraciones en prisma/migrations/
   │   └── Aplica las pendientes (si las hay)
   └── Ejecuta: npm start (inicia Express)
```

**Si hay migraciones pendientes, verás en los logs de Render:**
```
Applying migration `20260317080543_add_reservation_items_model`
Database schema updated successfully!
```

**Si no hay migraciones pendientes:**
```
Database schema is up to date!
```

---

## 📝 Crear una Nueva Migración (Desarrollo → Producción)

### Paso 1: Modificar el Schema (Local)

```bash
cd backend
# Editar prisma/schema.prisma
# Ejemplo: agregar campo "avatar" a User
```

### Paso 2: Crear la Migración (Local)

```bash
npm run db:migrate
# Prisma te pregunta: "Enter a name for the new migration:"
# Ejemplo: add_user_avatar_field
```

Esto:
- Crea una carpeta en `prisma/migrations/TIMESTAMP_add_user_avatar_field/`
- Aplica la migración en tu DB local (PostgreSQL en Docker)
- Actualiza `prisma/schema.prisma` y regenera el cliente

### Paso 3: Verificar la Migración

```bash
# Ver qué se creó
ls prisma/migrations/

# Ver el SQL generado
cat prisma/migrations/TIMESTAMP_add_user_avatar_field/migration.sql
```

### Paso 4: Commitear y Pushear

```bash
git add prisma/
git commit -m "feat: add user avatar field migration"
git push origin main
```

### Paso 5: Deploy Automático en Render

Render detecta el push y:
1. Hace build
2. **Aplica la migración en Neon** (usando `prisma migrate deploy`)
3. Inicia el servidor con el schema actualizado

---

## 🔍 Verificar que las Migraciones se Aplicaron en Neon

### Opción 1: Logs de Render

1. Ir a **Render Dashboard → Tu servicio → Logs**
2. Buscar líneas como:
   ```
   Applying migration `20260317080543_add_reservation_items_model`
   ```

### Opción 2: Dashboard de Neon

1. Ir a https://console.neon.tech
2. Seleccionar tu proyecto
3. Ir a **Tables**
4. Verificar que la tabla `_prisma_migrations` existe
5. Click en **SQL Editor** y ejecutar:
   ```sql
   SELECT migration_name, finished_at 
   FROM _prisma_migrations 
   ORDER BY finished_at DESC;
   ```

### Opción 3: Desde tu Local (conectándote a Neon)

```bash
cd backend

# Temporal: cambiar DATABASE_URL en .env a la URL de Neon
# O usar variable de entorno inline:
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require" npx prisma migrate status

# Ver las tablas en Prisma Studio
DATABASE_URL="postgresql://..." npx prisma studio
```

---

## 🚨 Problemas Comunes y Soluciones

### ❌ "Migration failed: relation already exists"

**Causa:** Intentaste aplicar una migración que ya se ejecutó parcialmente.

**Solución:**
```bash
# Conectarte a Neon y marcar la migración como aplicada
DATABASE_URL="..." npx prisma migrate resolve --applied NOMBRE_MIGRACION
```

### ❌ "Migration failed: column does not exist"

**Causa:** El código nuevo espera un campo que no existe en la DB de producción.

**Solución:**
```bash
# Aplicar manualmente las migraciones pendientes
DATABASE_URL="..." npx prisma migrate deploy
```

### ❌ "P1001: Can't reach database server"

**Causa:** `DATABASE_URL` incorrecta o Neon está caído.

**Solución:**
1. Verificar que `DATABASE_URL` en Render tiene `?sslmode=require` al final
2. Copiar la URL actualizada desde Neon Dashboard
3. Verificar que Neon no está en modo "sleep" (free tier)

### ❌ Render no está aplicando migraciones

**Causa:** Start Command no incluye `prisma migrate deploy`.

**Solución:**
1. Verificar que existe `render.yaml` en la raíz
2. O configurar manualmente Start Command: `cd backend && npx prisma migrate deploy && npm start`
3. Hacer un redeploy manual en Render

---

## 🧪 Migración de Datos (Data Migration)

Algunas migraciones requieren **transformar datos existentes** (no solo cambiar el schema).

**Ejemplo:** La migración `add_reservation_items_model` requirió:
1. Ejecutar script `backend/scripts/migrate-reservation-data.ts` (transforma datos viejos)
2. Aplicar migración SQL (cambia el schema)

**Proceso:**

```bash
# 1. Ejecutar script de migración de datos (antes de la migración SQL)
cd backend
DATABASE_URL="..." ts-node scripts/migrate-reservation-data.ts

# 2. Crear la migración SQL
npm run db:migrate
# Input: add_reservation_items_model

# 3. Commitear ambos (script + migración)
git add scripts/ prisma/migrations/
git commit -m "feat: migrate to multi-product reservations"
git push
```

**⚠️ IMPORTANTE:** En producción, **SIEMPRE ejecutar el script de datos ANTES** de que Render aplique la migración SQL.

---

## 📊 Estado Actual de Migraciones

Migraciones aplicadas en el proyecto (en orden cronológico):

| # | Fecha | Nombre | Descripción |
|---|-------|--------|-------------|
| 1 | 2026-02-27 | `init` | Schema inicial completo |
| 2 | 2026-03-02 | `add_imagenes_array` | Productos con múltiples imágenes |
| 3 | 2026-03-04 | `make_lat_lng_optional` | Coordenadas opcionales |
| 4 | 2026-03-07 | `add_colores_to_product` | Colores disponibles por producto |
| 5 | 2026-03-07 | `add_memorias_to_product` | Almacenamiento disponible por producto |
| 6 | 2026-03-09 | `remove_round_robin_state` | Limpieza de tabla redundante |
| 7 | 2026-03-10 | `add_refresh_tokens` | Soporte para JWT refresh tokens |
| 8 | 2026-03-10 | `add_password_reset_tokens` | Recuperación de contraseña |
| 9 | 2026-03-12 | `add_performance_indexes` | Optimización de queries |
| 10 | 2026-03-16 | `change_pagos_semanales_to_string` | Flexibilidad en pagos |
| 11 | 2026-03-17 | `add_reservation_items_model` | **Carrito multi-producto** |

**Última migración:** `add_reservation_items_model` (2026-03-17)

---

## 🎯 Checklist para Deployment

Antes de hacer deploy a producción:

- [ ] **Local:** Todas las migraciones aplicadas (`npm run db:migrate:status`)
- [ ] **Local:** Build exitoso (`npm run build`)
- [ ] **Render:** Variables de entorno configuradas (especialmente `DATABASE_URL`)
- [ ] **Render:** Start Command incluye `npx prisma migrate deploy`
- [ ] **Neon:** Base de datos activa (no en sleep mode)
- [ ] **Git:** Migraciones commiteadas en `prisma/migrations/`
- [ ] **Logs:** Revisar logs de Render después del deploy para confirmar migraciones

---

## 🔗 Referencias

- [Prisma Migrate Deploy](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production#production-and-testing-environments)
- [Render Build & Deploy](https://render.com/docs/deploys)
- [Neon PostgreSQL](https://neon.tech/docs/introduction)
- Guía de deployment: `DEPLOYMENT-GUIDE.md`
- Variables de entorno: `backend/.env.example`
