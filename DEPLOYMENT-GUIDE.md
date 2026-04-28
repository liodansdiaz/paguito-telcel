# 🚀 GUÍA COMPLETA: DEPLOYMENT A PRODUCCIÓN

Esta guía te lleva paso a paso para desplegar **Paguito Telcel** en producción.

---

## 📋 ÍNDICE

1. [Variables de Entorno](#-1-variables-de-entorno)
2. [Servicios Requeridos](#-2-servicios-requeridos)
3. [Configuración de Servicios](#-3-configuración-de-servicios)
4. [Deploy en Render](#-4-deploy-en-render)
5. [Después del Deploy](#-5-después-del-deploy)
6. [Mantenimiento](#-6-mantenimiento)

---

## 📌 1. VARIABLES DE ENTORNO

### Variables OBLIGATORIAS (ya configuradas en `.env`)

| Variable | Valor en desarrollo | Notas |
|----------|-------------------|-------|
| `NODE_ENV` | `development` | Cambiar a `production` |
| `DATABASE_URL` | `postgresql://...` | URL de PostgreSQL en producción |
| `JWT_SECRET` |生成随机字符串 | Mínimo 256 bits |
| `JWT_REFRESH_SECRET` | 生成随机字符串 | Mínimo 256 bits |
| `REDIS_ENABLED` | `true` | Redis habilitado |
| `REDIS_PASSWORD` | `amigopaguitostelcelredis` | ✅ Ya configurado |
| `CLOUDINARY_CLOUD_NAME` | `dq4mwiut5` | ✅ Ya configurado |
| `CLOUDINARY_API_KEY` | `935634316473337` | ✅ Ya configurado |
| `CLOUDINARY_API_SECRET` | `I6WBLN9...` | ✅ Ya configurado |

### Variables del FRONTEND

| Variable | Descripción |
|----------|-------------|
| `VITE_BACKEND_URL` | URL del backend en producción |

### Variables de SMTP (Email)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NOTIFICATIONS_EMAIL` | `true` o `false` | Habilitar notificaciones |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto | `587` |
| `SMTP_USER` | Usuario de email | `tuemail@gmail.com` |
| `SMTP_PASS` | App Password de Gmail | (generar en Google) |
| `EMAIL_FROM` | Email remitente | `Paguito Telcel <tuemail@gmail.com>` |

### Variables de WhatsApp (Evolution API)

| Variable | Descripción | Valor |
|----------|-------------|-------|
| `NOTIFICATIONS_WHATSAPP` | `true` o `false` | `false` por defecto |
| `EVOLUTION_API_URL` | URL de Evolution API | Configurar si se usa |
| `EVOLUTION_API_KEY` | API Key de Evolution | Configurar si se usa |
| `EVOLUTION_INSTANCE_NAME` | Nombre de instancia | `paguito` |

### Variables de Chat IA

| Variable | Descripción |
|----------|-------------|
| `GROQ_API_KEY` | API Key de Groq (opcional) |

### Variables de Resumen Diario

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DAILY_SUMMARY_HOUR` | Hora del resumen diario | `18` |

### Cómo GENERAR Secrets Aleatorios

```bash
# En Mac/Linux:
openssl rand -base64 32

# En Windows PowerShell:
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes(32) | ForEach-Object { [System.BitConverter]::ToString($_) } -replace '-'
```

---

## 📌 2. SERVICIOS REQUERIDOS

### Servicios обязательно (ya tienes cuenta):

| Servicio | Estado | Acción requerida |
|---------|--------|----------------|
| **Cloudinary** | ✅ Configurado | Ninguna |
| **PostgreSQL** | ✅ En uso local | Crear DB en producción |
| **Redis** | ✅ Configurado con password | Ninguna |
| **Evolution API** | ✅ En Docker | Ninguna (local) |

### Servicios por configurar:

| Servicio | Alternativa gratuita |
|---------|-------------------|
| **SMTP (Email)** | Gmail con App Password |
| **WhatsApp** | Evolution API (ya en docker-compose) |

---

## 📌 3. CONFIGURACIÓN DE SERVICIOS

### 3.1 PostgreSQL (Render/Railway)

**Opción A: Render (recomendado)**

1. Ir a https://dashboard.render.com
2. New Resource → PostgreSQL
3. Configurar:
   - Name: `paguito-postgres`
   - Database: `paguito_telcel`
   - User: `paguito`
4. Copiar la URL que te da Render:
   ```
   postgresql://paguito:password@host.render.com:5432/paguito_telcel
   ```

**Opción B: Railway**

1. Ir a https://railway.app
2. New Project → PostgreSQL
3.copiar la URL de conexión

### 3.2 Gmail (para SMTP)

**Paso 1: Habilitar 2FA en tu cuenta de Google**

**Paso 2: Generar App Password**
1. Ir a https://myaccount.google.com/security
2. Buscar "App Passwords" (puede estar en "Seguridad" → "Google no ha verificado")
3. Seleccionar app: "Correo"
4. Seleccionar dispositivo: "Otro (nombre personalizado)"
5. Nombre: "Paguito Telcel"
6. Copiar la contraseña de 16 caracteres (algo como `abcd efgh ijkl mnop`)

**Paso 3: Configurar variables:**
```bash
NOTIFICATIONS_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuemail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=Paguito Telcel <tuemail@gmail.com>
```

### 3.3 Evolution API (WhatsApp)

**Para desarrollo ya está en docker-compose:**
```bash
docker-compose up -d evolution-api
```

**Para producción:** Hay varias opciones:

**Opción A: Mantener en tu servidor (si tienes VPS)**
- Ya está configurado en docker-compose

**Opción B: Usar Evolution API en la nube**
- Servicios como https://hub.evolution-api.com
- O self-host en Railway/Render

**Para conectarte desde producción:**
```bash
EVOLUTION_API_URL=http://tu-servidor:8080
EVOLUTION_API_KEY=tu-api-key
NOTIFICATIONS_WHATSAPP=true
```

---

## 📌 4. DEPLOY EN RENDER

### Paso 1: Preparar el Backend

**1.1 Asegurate de tener el código en GitHub:**
```bash
git status
git add .
git commit -m "Listo para producción"
git push origin main
```

**1.2 Verificar `package.json`:**
```json
{
  "scripts": {
    "start": "node dist/app.js",
    "build": "tsc",
    "dev": "ts-node-dev --respawn src/app.ts"
  }
}
```

### Paso 2: Crear Web Service en Render

1. Ir a https://dashboard.render.com
2. Click en "New +" → "Web Service"
3. Conectar tu repositorio de GitHub
4. Configurar:

| Campo | Valor |
|-------|-------|
| **Name** | `paguito-backend` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `cd backend && npm install && npx prisma generate && npm run build` |
| **Start Command** | `cd backend && npx prisma migrate deploy && npm start` |

> **⚠️ IMPORTANTE:** El Start Command DEBE incluir `npx prisma migrate deploy` para aplicar migraciones automáticamente en cada deploy. Esto se conecta a Neon y actualiza el schema de la base de datos antes de iniciar el servidor.

> **💡 ALTERNATIVA:** Si agregaste el archivo `render.yaml` en la raíz del proyecto, Render usará automáticamente esa configuración y no necesitas configurar manualmente estos campos.

### Paso 3: Variables de Entorno en Render

En la sección "Environment" del web service, agregar:

```
NODE_ENV=production
DATABASE_URL=postgresql://... (URL de PostgreSQL de Render)
JWT_SECRET=... (generar uno nuevo y seguro)
JWT_REFRESH_SECRET=... (generar uno nuevo y seguro)
REDIS_ENABLED=true
REDIS_HOST=... (URL de Redis de Render)
REDIS_PORT=6379
REDIS_PASSWORD=amigopaguitostelcelredis
CLOUDINARY_CLOUD_NAME=dq4mwiut5
CLOUDINARY_API_KEY=935634316473337
CLOUDINARY_API_SECRET=I6WBLn9BqfIDPBYV7TDSB-aseBk
NOTIFICATIONS_EMAIL=false
NOTIFICATIONS_WHATSAPP=false
FRONTEND_URL=https://tu-frontend.onrender.com
```

### Paso 4: Crear el Frontend

1. En Render, New → "Web Service"
2. Conectar repositorio
3. Configurar:

| Campo | Valor |
|-------|-------|
| **Name** | `paguito-frontend` |
| **Branch** | `main` |
| **Runtime** | `Static` |
| **Build Command** | `npm run build` |
| **Publish directory** | `dist` o `build` |

**Variables del frontend:**
```
VITE_BACKEND_URL=https://paguito-backend.onrender.com
```

### Paso 5: PostgreSQL en Render (si no lo creaste)

1. New → "PostgreSQL"
2. Configurar nombre y usuario
3. Copiar la URL resultante

### Paso 6: Redis en Render (si no tienes externo)

1. New → "Redis"
2. Configurar
3. Usar la URL en las variables del backend

---

## 📌 5. DESPUÉS DEL DEPLOY

### 5.1 Verificar que funciona

1. Abrir la URL del backend:
   ```
   https://paguito-backend.onrender.com/api/products
   ```
   Debe responder con JSON

2. Probar el login:
   ```
   POST https://paguito-backend.onrender.com/api/auth/login
   Body: { "email": "admin@paguito.com", "password": "PaguitoTelcel2024!" }
   ```

### 5.2 CAMBIAR LA PASSWORD DEL ADMIN

⚠️ IMPORTANTE: La password por defecto debe cambiarse inmediatamente.

```bash
# Opción 1: Desde el panel admin (cuando esté funcionando)
# Ir a Admin > Usuarios > Cambiar password

# Opción 2: Directamente en BD ( Render Data >
psql -h host -U user -d paguito_telcel
UPDATE "User" SET password = '$2b$12$...' WHERE email = 'admin@paguito.com';
```

Para generar nuevo hash:
```bash
# En tu máquina local:
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('TuNuevaPassword123!', 12));"
```

### 5.3 Migrar datos a producción (si tienes datos locales)

**Exportar desde local:**
```bash
pg_dump -U paguito paguito_telcel > backup.sql
```

**Importar en producción:**
```bash
# En la DB de Render:
psql -h hostname.render.com -U user -d paguito_telcel < backup.sql
```

### 5.4 Verificar Cloudinary

1. Subir una imagen de prueba desde el panel admin
2. Verificar que la URL sea de Cloudinary:
   ```
   https://res.cloudinary.com/dq4mwiut5/image/upload/...
   ```

---

## 📌 6. MANTENIMIENTO

### 6.1 Backups de la base de datos

**En Render:**
- Ir al servicio de PostgreSQL
- "Backups" → configurar automático

**Manual:**
```bash
# Exportar
pg_dump -h $DB_HOST -U $DB_USER -d paguito_telcel > backup_$(date +%Y%m%d).sql

# Importar
psql -h $DB_HOST -U $DB_USER -d paguito_telcel < backup_20240101.sql
```

### 6.2 Logs

**En Render:**
- Ir al web service → "Logs"

**En desarrollo local:**
```bash
tail -f logs/app.log
```

### 6.3 Monitoreo

**Opciones:**
- Render tiene logs integrados
- Sentry para errores: https://sentry.io

### 6.4 Actualizar la aplicación

```bash
# Hacer cambios en código
git add .
git commit -m "fix: ..."
git push

# Render hace rebuild automático
```

---

## ⚠️ CHECKLIST ANTES DE PRODUCCIÓN

- [ ] Cambiar password del admin (`PaguitoTelcel2024!`)
- [ ] Configurar DATABASE_URL en producción
- [ ] Generar nuevos JWT secrets (no usar los de desarrollo)
- [ ] Configurar REDIS_PASSWORD en producción
- [ ] Probar login con credenciales reales
- [ ] Verificar que Cloudinary funciona (subir imagen de prueba)
- [ ] Configurar SMTP (opcional, para emails)
- [ ] Verificar que el frontend conecta al backend

---

## 🔧 COMANDOS ÚTILES

```bash
# Desarrollo
cd backend && npm run dev
cd frontend && npm run dev

# Producción (build)
npm run build

# Tests
npm test

# Seed (crear admin)
npm run db:seed

# Migraciones
npm run db:migrate
npm run db:push
```

---

## ❓ PREGUNTAS FRECUENTES

### "¿Puedo usar otro proveedor além de Render?"

Sí, las alternativas son:
- **Railway** (similar a Render, más simple)
- **Vercel** (solo frontend)
- **Railway** + **Vercel**
- **AWS EC2** (más complejo, pero más control)
- **DigitalOcean** (VPS)
- **VPS propio** (si tienes servidor)

### "¿Qué pasó con Evolution API?"

En desarrollo está en docker-compose. Para producción:
- Opción 1: Mantener en tu servidor/VPS
- Opción 2: Usar un servicio como https://hub.evolution-api.com
- Opción 3: Self-host en Railway como worker

### "¿Necesito dominio propio?"

No es obligatorio, perorecommended:
- PuedesComprar en GoDaddy, Namecheap, o Google Domains
- O usar el subdominio de Render: `tu-app.onrender.com`

---

## 📝 NOTAS

- La primera vez que ejecutes el backend, se crean las tablas automáticamente
- El seed se puede ejecutar localmente: `npm run db:seed`
- En producción, las imágenes se guardan en Cloudinary (no se pierden)
- Redis se usa para caché y rate limiting

---

**¿Dudas o problemas?** Revisa los logs en Render o contáctame.