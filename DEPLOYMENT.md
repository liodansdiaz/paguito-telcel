# Guía de Despliegue - Paguito Telcel

Esta guía explica paso a paso cómo publicar tu aplicación en internet, separada en tres partes: **Base de Datos**, **Backend** y **Frontend**.

---

## TABLA DE CONTENIDOS

1. [Visión General](#1-visión-general)
2. [Parte 1: Base de Datos (Neon)](#2-parte-1-base-de-datos-neon)
3. [Parte 2: Backend (Railway)](#3-parte-2-backend-railway)
4. [Parte 3: Frontend (Vercel)](#4-parte-3-frontend-vercel)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Verificación Final](#6-verificación-final)
7. [Problemas Comunes](#7-problemas-comunes)

---

## 1. VISIÓN GENERAL

Tu aplicación tiene 3 partes que se publican por separado:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   FRONTEND   │ ───> │   BACKEND    │ ───> │  BASE DE     │
│   (Vercel)   │      │  (Railway)   │      │  DATOS       │
│              │      │              │      │  (Neon)      │
│  Tu sitio    │      │  Tu API      │      │  Tus datos   │
│  web público │      │  REST        │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

- **Frontend** = la página web que ve el usuario (React/Vite)
- **Backend** = el servidor que procesa las peticiones (Node.js/Express)
- **Base de datos** = donde se guardan los datos (PostgreSQL en Neon)

---

## 2. PARTE 1: BASE DE DATOS (NEON)

Neon es un servicio de PostgreSQL en la nube. Es gratuito para uso básico.

### 2.1 Crear cuenta en Neon

1. Abre tu navegador y ve a **https://neon.tech**
2. Haz clic en **"Sign Up"** o **"Get Started"**
3. Puedes registrarte con tu cuenta de **Google** o **GitHub** (más fácil)
4. Si te pide verificar correo, hazlo

### 2.2 Crear un proyecto

1. Después de registrarte, te pide crear un proyecto
2. **Project Name:** escribe `paguito-telcel`
3. **Database Name:** déjalo como `neondb` o cámbialo a `paguito_telcel`
4. **Region:** selecciona la más cercana a México (por ejemplo `US East` o `US West`)
5. Haz clic en **"Create Project"**

### 2.3 Copiar la Connection String

1. Después de crear el proyecto, verás una pantalla con información de conexión
2. Busca el botón **"Connection Details"** o **"Connect"**
3. Asegúrate de seleccionar **"Connection string"** (no "Parameters")
4. Copia la string que se ve así:

```
postgresql://neondb_owner:abc123xyz@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

5. **Guarda esta string en un lugar seguro** (la necesitarás después)

### 2.4 Importar tus datos existentes

Si ya tienes datos en tu base de datos local de Docker:

1. Abre una terminal en la carpeta del proyecto
2. Crea un backup de tu base local:

```bash
docker exec -t paguito-postgres pg_dump -U paguito paguito_telcel -F p > backup.sql
```

3. Crea un container temporal de Docker:

```bash
docker run -d --name neon-restore postgres:16-alpine sleep 300
```

4. Copia el backup al container:

```bash
docker cp backup.sql neon-restore:/tmp/backup.sql
```

5. Restaura en Neon (reemplaza CONNECTION_STRING con la tuya):

```bash
docker exec neon-restore psql "CONNECTION_STRING" -f /tmp/backup.sql
```

6. Da permisos a las tablas:

```bash
docker exec neon-restore psql "CONNECTION_STRING" -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO neondb_owner"
```

7. Limpia:

```bash
docker rm -f neon-restore
rm backup.sql
```

### 2.5 Actualizar tu archivo .env

En el archivo `backend/.env`, cambia la variable `DATABASE_URL` por la connection string de Neon:

```env
DATABASE_URL="postgresql://neondb_owner:abc123xyz@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### 2.6 Ejecutar migraciones de Prisma

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 2.7 Verificar que funciona

```bash
npm run dev
```

Si el backend arranca sin errores, la conexión a Neon funciona.

---

## 3. PARTE 2: BACKEND (RAILWAY)

Railway es una plataforma para publicar servidores. Tiene un plan gratuito limitado.

### 3.1 Preparar el backend para producción

#### 3.1.1 Verificar que el build funciona

En tu máquina local, ejecuta:

```bash
cd backend
npm run build
```

Si ves la carpeta `dist/` creada sin errores, estás listo.

#### 3.1.2 Crear archivo de inicio

Railway necesita saber cómo arrancar tu aplicación. Verifica que tu `backend/package.json` tenga estos scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

#### 3.1.3 Crear archivo Dockerfile (recomendado)

Crea el archivo `backend/Dockerfile` con este contenido:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 3.2 Crear cuenta en Railway

1. Ve a **https://railway.app**
2. Haz clic en **"Login"** e inicia sesión con **GitHub**
3. Si te pide permisos, acepta

### 3.3 Crear un proyecto en Railway

1. Haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub Repo"**
3. Si es la primera vez, te pide conectar tu cuenta de GitHub
4. Selecciona tu repositorio `paguito-telcel`
5. Railway detectará automáticamente el proyecto

### 3.4 Configurar el servicio

1. Railway te preguntará qué desplegar. Selecciona la carpeta `backend/`
   - Si no te pregunta, ve a **Settings > Root Directory** y pon `backend`
2. En **Settings > Start Command**, asegúrate que sea `npm start`
3. En **Settings > Build Command**, asegúrate que sea `npm run build`

### 3.5 Configurar variables de entorno

1. En tu servicio de Railway, ve a la pestaña **"Variables"**
2. Agrega cada una de estas variables (haz clic en **"New Variable"**):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La connection string de Neon (la que copiaste en el paso 2.3) |
| `JWT_SECRET` | Ejecuta `npm run generate-secrets` en tu máquina local para obtener un valor seguro |
| `JWT_REFRESH_SECRET` | Igual que arriba, otro valor generado |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Lo pondrás después (ej: `https://paguito-telcel.vercel.app`) |
| `NOTIFICATIONS_EMAIL` | `false` |
| `NOTIFICATIONS_WHATSAPP` | `false` |
| `NOTIFICATIONS_INTERNAL` | `true` |
| `REDIS_ENABLED` | `false` (Redis no es necesario para empezar) |
| `GROQ_API_KEY` | Tu API key de Groq (si la tienes) |

3. Guarda las variables

### 3.6 Generar secrets seguros

En tu máquina local, ejecuta:

```bash
cd backend
npm run generate-secrets
```

Esto te dará valores largos y seguros para `JWT_SECRET` y `JWT_REFRESH_SECRET`. Cópialos y pégalos en Railway.

### 3.7 Desplegar

1. Railway desplegará automáticamente después de configurar las variables
2. Ve a la pestaña **"Deployments"** para ver el progreso
3. Si hay errores, revisa los **Logs**
4. Cuando termine exitosamente, verás un estado **"Success"**

### 3.8 Obtener la URL del backend

1. Ve a la pestaña **"Settings"** de tu servicio
2. Busca la sección **"Networking"** o **"Domains"**
3. Haz clic en **"Generate Domain"**
4. Railway te dará una URL como: `https://paguito-backend-xxxx.up.railway.app`
5. **Guarda esta URL** (la necesitarás para el frontend)

### 3.9 Verificar que el backend funciona

Abre tu navegador y ve a:

```
https://tu-url-de-railway/api/health
```

Deberías ver una respuesta JSON indicando que el servidor está funcionando.

---

## 4. PARTE 3: FRONTEND (VERCEL)

Vercel es una plataforma para publicar sitios web. Es gratuito para proyectos personales.

### 4.1 Preparar el frontend para producción

#### 4.1.1 Crear archivo de variables de entorno

Crea el archivo `frontend/.env.production` con:

```env
VITE_API_URL=https://tu-url-de-railway/api
```

Reemplaza `https://tu-url-de-railway` con la URL que obtuviste en el paso 3.8.

#### 4.1.2 Verificar que el build funciona

```bash
cd frontend
npm run build
```

Si ves la carpeta `dist/` creada sin errores, estás listo.

### 4.2 Crear cuenta en Vercel

1. Ve a **https://vercel.com**
2. Haz clic en **"Sign Up"** e inicia sesión con **GitHub**
3. Si te pide permisos, acepta

### 4.3 Importar tu proyecto

1. Haz clic en **"Add New..."** > **"Project"**
2. Selecciona tu repositorio `paguito-telcel`
3. Haz clic en **"Import"**

### 4.4 Configurar el proyecto

Vercel debería detectar automáticamente que es un proyecto Vite. Verifica:

| Configuración | Valor |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

Si el Root Directory no está configurado, haz clic en él y selecciona `frontend`.

### 4.5 Configurar variables de entorno

1. Antes de desplegar, expande la sección **"Environment Variables"**
2. Agrega:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://tu-url-de-railway/api` |

Reemplaza con la URL real de Railway.

### 4.6 Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que termine (tarda 1-3 minutos)
3. Cuando termine, verás un mensaje de éxito con tu URL

### 4.7 Obtener la URL del frontend

Vercel te dará una URL como: `https://paguito-telcel.vercel.app`

### 4.8 Configurar el frontend en producción

Vercel necesita saber cómo manejar las rutas de React Router. Crea el archivo `frontend/public/_redirects` con:

```
/*    /index.html   200
```

Esto asegura que todas las rutas del sitio funcionen correctamente.

### 4.9 Actualizar el backend con la URL del frontend

1. Ve a Railway (tu backend)
2. Ve a **Variables**
3. Actualiza `FRONTEND_URL` con la URL de Vercel:

```
FRONTEND_URL=https://paguito-telcel.vercel.app
```

4. Railway redeployará automáticamente

---

## 5. VARIABLES DE ENTORNO

### Resumen de todas las variables necesarias

#### Backend (Railway)

| Variable | Ejemplo | Descripción |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Connection string de Neon |
| `JWT_SECRET` | `abc123...` | Secret para tokens de acceso (mínimo 32 caracteres) |
| `JWT_REFRESH_SECRET` | `xyz789...` | Secret para refresh tokens |
| `JWT_EXPIRES_IN` | `15m` | Duración del token de acceso |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Duración del refresh token |
| `PORT` | `3000` | Puerto del servidor |
| `NODE_ENV` | `production` | Entorno de ejecución |
| `FRONTEND_URL` | `https://tu-frontend.vercel.app` | URL del frontend (para CORS) |
| `NOTIFICATIONS_EMAIL` | `false` | Habilitar notificaciones por email |
| `NOTIFICATIONS_WHATSAPP` | `false` | Habilitar notificaciones por WhatsApp |
| `NOTIFICATIONS_INTERNAL` | `true` | Habilitar notificaciones internas |
| `REDIS_ENABLED` | `false` | Habilitar Redis (opcional) |
| `GROQ_API_KEY` | `gsk_...` | API key de Groq AI (opcional) |

#### Frontend (Vercel)

| Variable | Ejemplo | Descripción |
|---|---|---|
| `VITE_API_URL` | `https://tu-backend.railway.app/api` | URL del backend API |

---

## 6. VERIFICACIÓN FINAL

Después de desplegar las 3 partes, verifica que todo funcione:

### 6.1 Probar el frontend

1. Abre tu URL de Vercel en el navegador
2. Verifica que la página principal carga
3. Navega al catálogo de productos
4. Verifica que los productos se muestran

### 6.2 Probar el login de administrador

1. Ve a la URL de tu frontend + `/login`
2. Ingresa con las credenciales de administrador
3. Verifica que puedes ver el panel de administración

### 6.3 Probar la creación de reservas

1. Desde el frontend público, agrega un producto al carrito
2. Completa el formulario de reserva
3. Verifica que la reserva se crea correctamente

### 6.4 Probar el panel de vendedor

1. Inicia sesión como vendedor
2. Verifica que puedes ver tus reservas asignadas

---

## 7. PROBLEMAS COMUNES

### Error: "CORS policy" en el navegador

**Causa:** El backend no permite conexiones desde el frontend.

**Solución:**
1. Ve a Railway (tu backend)
2. Verifica que `FRONTEND_URL` tenga la URL correcta de Vercel
3. Incluye `https://` al inicio
4. No incluyas `/` al final

### Error: "Cannot connect to database"

**Causa:** La connection string de Neon es incorrecta.

**Solución:**
1. Ve a Neon > tu proyecto > Connection Details
2. Copia la connection string nuevamente
3. Asegúrate de que tenga `?sslmode=require` al final
4. Pégala en Railway en la variable `DATABASE_URL`

### Error: "Table does not exist"

**Causa:** Las migraciones de Prisma no se ejecutaron.

**Solución:**
1. Conecta a tu base de Neon localmente cambiando la `DATABASE_URL` en tu `.env`
2. Ejecuta: `npx prisma migrate deploy`

### El frontend no carga datos

**Causa:** La variable `VITE_API_URL` es incorrecta.

**Solución:**
1. Ve a Vercel > tu proyecto > Settings > Environment Variables
2. Verifica que `VITE_API_URL` tenga la URL correcta de Railway
3. Debe terminar en `/api`
4. Después de cambiar, haz clic en **"Redeploy"**

### Las imágenes de productos no se ven

**Causa:** Las imágenes se guardan localmente en el backend.

**Solución para producción:**
1. Configura Cloudinary en las variables de entorno
2. O usa un servicio de almacenamiento en la nube
3. Las variables necesarias son:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### El servidor se apaga después de un tiempo (Railway gratuito)

**Causa:** El plan gratuito de Railway tiene límites.

**Solución:**
1. Railway gratuito da $5 de crédito mensual
2. Monitorea tu uso en el dashboard
3. Si necesitas más, considera actualizar a plan de pago

### Las variables de entorno no se aplican

**Causa:** Railway/Vercel necesitan un nuevo despliegue.

**Solución:**
1. Después de cambiar variables, haz clic en **"Redeploy"**
2. Espera a que termine el despliegue
3. Verifica en los logs que las variables están correctas

---

## COMANDOS ÚTILES

### Generar secrets seguros
```bash
cd backend
npm run generate-secrets
```

### Crear backup de la base de datos
```bash
docker exec -t paguito-postgres pg_dump -U paguito paguito_telcel -F p > backup.sql
```

### Ejecutar migraciones en Neon
```bash
cd backend
# Cambia DATABASE_URL en .env por la de Neon
npx prisma migrate deploy
npx prisma generate
```

### Ver logs del backend en Railway
1. Ve a tu servicio en Railway
2. Pestaña "Deployments"
3. Haz clic en el despliegue más reciente
4. Revisa los logs

### Ver logs del frontend en Vercel
1. Ve a tu proyecto en Vercel
2. Pestaña "Deployments"
3. Haz clic en el despliegue más reciente
4. Revisa los logs

---

## CRONOGRAMA SUGERIDO

| Paso | Tiempo estimado |
|---|---|
| Crear cuenta en Neon | 5 minutos |
| Importar base de datos | 10 minutos |
| Crear cuenta en Railway | 5 minutos |
| Desplegar backend | 15 minutos |
| Crear cuenta en Vercel | 5 minutos |
| Desplegar frontend | 10 minutos |
| Verificar todo | 10 minutos |
| **Total** | **~60 minutos** |
