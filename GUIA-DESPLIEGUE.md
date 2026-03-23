# Guía de Despliegue - Paguito Telcel

Esta guía te explica paso a paso cómo desplegar tu proyecto en internet usando:
- **Neon** → Base de datos PostgreSQL
- **Render** → Backend (API)
- **Vercel** → Frontend (página web)

Además se configura despliegue automático: cada vez que subas código a GitHub, los servidores se actualizan solos.

---

## Tabla de contenidos

1. [Paso 0: Preparar el repositorio en GitHub](#paso-0-preparar-el-repositorio-en-github)
2. [Paso 1: Crear la base de datos en Neon](#paso-1-crear-la-base-de-datos-en-neon)
3. [Paso 2: Desplegar el backend en Render](#paso-2-desplegar-el-backend-en-render)
4. [Paso 3: Desplegar el frontend en Vercel](#paso-3-desplegar-el-frontend-en-vercel)
5. [Paso 4: Configurar variables de entorno finales](#paso-4-configurar-variables-de-entorno-finales)
6. [Paso 5: Ejecutar la migración de la base de datos](#paso-5-ejecutar-la-migracion-de-la-base-de-datos)
7. [Paso 6: Verificar que todo funciona](#paso-6-verificar-que-todo-funciona)
8. [Despliegue automático desde GitHub](#despliegue-automatico-desde-github)
9. [Solución de problemas comunes](#solucion-de-problemas-comunes)

---

## Paso 0: Preparar el repositorio en GitHub

Antes de empezar, asegúrate de que tu repositorio en GitHub tenga la estructura correcta:

```
paguito-telcel/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       └── app.ts
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
└── README.md
```

**Importante:** Asegúrate de que el archivo `.gitignore` en la raíz del proyecto incluya:

```
# No subir archivos de entorno
**/.env
**/.env.local
**/.env.production

# No subir dependencias
node_modules/

# No subir compilados
backend/dist/
frontend/dist/
```

Si ya tienes tu proyecto en GitHub, puedes continuar al siguiente paso.

---

## Paso 1: Crear la base de datos en Neon

Neon es un servicio de PostgreSQL en la nube. Tu base de datos local de Docker se reemplazará por esta.

### 1.1 Crear cuenta en Neon

1. Ve a [https://neon.tech](https://neon.tech)
2. Haz clic en **"Sign up"** (Registrarse)
3. Elige **"Continue with GitHub"** para vincular tu cuenta de GitHub directamente

### 1.2 Crear un nuevo proyecto

1. Una vez dentro, haz clic en **"Create a project"**
2. Configura lo siguiente:
   - **Project name:** `paguito-telcel`
   - **Postgres version:** `16` (o la más reciente disponible)
   - **Region:** Elige la más cercana a México. Las opciones recomendadas son:
     - `US East (Ohio)`
     - `US West (Oregon)`
   - **Database name:** `paguito_telcel` (déjalo por defecto si ya tiene uno)
3. Haz clic en **"Create project"**

### 1.3 Copiar la cadena de conexión

Después de crear el proyecto, Neon te muestra una pantalla con la cadena de conexión. Se ve algo así:

```
postgresql://neondb_owner:abc123xyz@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Copia esta cadena completa** y guárdala en un lugar seguro. La necesitarás para configurar el backend.

Si la pierdes, puedes encontrarla después así:
1. En el panel de Neon, haz clic en tu proyecto
2. Ve a **"Dashboard"**
3. En la sección **"Connection string"**, haz clic en el ícono de copiar

### 1.4 Habilitar el pool de conexiones (importante)

Neon tiene un modo "pooler" que es necesario para que Render se conecte correctamente:

1. En el dashboard de Neon, ve a la pestaña **"Dashboard"**
2. Busca la sección **"Connection string"**
3. Arriba a la derecha hay un toggle que dice **"Pooled connection"** o **"Connection pooling"**
4. Actívalo
5. Copia la nueva cadena de conexión que aparece (tiene `-pooler` en el host)

La cadena pooled se ve así:
```
postgresql://neondb_owner:abc123xyz@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Usa siempre la cadena con `-pooler` para la variable `DATABASE_URL`.**

---

## Paso 2: Desplegar el backend en Render

Render es un servicio que ejecuta tu código Node.js en la nube.

### 2.1 Crear cuenta en Render

1. Ve a [https://render.com](https://render.com)
2. Haz clic en **"Get Started for Free"**
3. Elige **"Sign up with GitHub"** para vincular tu cuenta

### 2.2 Conectar tu repositorio de GitHub

1. En el panel de Render, haz clic en tu avatar (esquina superior derecha)
2. Ve a **"Account settings"** → **"Git Providers"**
3. Haz clic en **"Connect"** junto a GitHub
4. Autoriza a Render a acceder a tus repositorios
5. Selecciona el repositorio `paguito-telcel` (o dale acceso a todos los repos que necesites)

### 2.3 Crear un nuevo Web Service

1. En el dashboard de Render, haz clic en **"New +"** (esquina superior derecha)
2. Selecciona **"Web Service"**
3. En la lista de repositorios, busca y selecciona **`paguito-telcel`**
4. Configura el servicio con estos valores:

| Campo | Valor |
|---|---|
| **Name** | `paguito-telcel-api` |
| **Region** | `Oregon (US West)` o la más cercana |
| **Branch** | `main` (o la rama principal de tu repo) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npx prisma migrate deploy && npm start` |
| **Instance Type** | `Free` (para empezar) |

5. Antes de hacer clic en "Create", expande la sección **"Advanced"**

### 2.4 Configurar variables de entorno en Render

En la sección **"Advanced"**, busca **"Environment Variables"** y agrega las siguientes:

| Variable | Valor | Descripción |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:...` | La cadena de conexión de Neon (con -pooler) |
| `NODE_ENV` | `production` | Entorno de producción |
| `FRONTEND_URL` | `https://paguito-telcel.vercel.app` | La URL de tu frontend en Vercel (la actualizarás después) |
| `JWT_SECRET` | *(genera una clave)* | Clave secreta para tokens de acceso |
| `JWT_REFRESH_SECRET` | *(genera otra clave)* | Clave secreta para tokens de refresh |
| `JWT_EXPIRES_IN` | `15m` | Duración del token de acceso |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Duración del token de refresh |
| `PORT` | `3000` | Puerto del servidor |
| `REDIS_ENABLED` | `false` | Deshabilitar Redis por ahora (no lo necesitas en Render free) |
| `NOTIFICATIONS_INTERNAL` | `true` | Notificaciones internas |
| `NOTIFICATIONS_EMAIL` | `false` | Deshabilitar email por ahora |
| `NOTIFICATIONS_WHATSAPP` | `false` | Deshabilitar WhatsApp por ahora |

### 2.5 Generar las claves JWT_SECRET

Para generar las claves secretas, puedes usar este comando en tu terminal local:

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Cada vez que ejecutes el comando, te dará una cadena larga de caracteres aleatorios. Cópiala y pégala en Render.

### 2.6 Crear el servicio

1. Haz clic en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu backend
3. El proceso tarda entre 2 y 5 minutos la primera vez
4. Cuando termine, verás un mensaje de éxito y la URL de tu API

La URL se verá así: `https://paguito-telcel-api.onrender.com`

**Cópia esta URL**, la necesitarás para configurar el frontend.

### 2.7 Verificar que el backend funciona

1. Abre tu navegador
2. Ve a `https://paguito-telcel-api.onrender.com/api/health`
3. Deberías ver una respuesta JSON indicando que el servidor está funcionando

---

## Paso 3: Desplegar el frontend en Vercel

Vercel es el servicio ideal para desplegar aplicaciones React/Vite.

### 3.1 Crear cuenta en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Elige **"Continue with GitHub"** para vincular tu cuenta

### 3.2 Importar tu proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**
2. En la sección **"Import Git Repository"**, busca `paguito-telcel`
3. Haz clic en **"Import"** junto a tu repositorio

### 3.3 Configurar el proyecto

Vercel debería detectar automáticamente que es un proyecto Vite. Configura lo siguiente:

| Campo | Valor |
|---|---|
| **Framework Preset** | `Vite` (debería detectarlo automáticamente) |
| **Root Directory** | Haz clic en **"Edit"** y selecciona `frontend` |
| **Build Command** | `npm run build` (debería completarse solo) |
| **Output Directory** | `dist` (debería completarse solo) |
| **Install Command** | `npm install` (debería completarse solo) |

### 3.4 Configurar variables de entorno en Vercel

Antes de desplegar, expande la sección **"Environment Variables"** y agrega:

| Variable | Valor |
|---|---|
| `VITE_BACKEND_URL` | `https://paguito-telcel-api.onrender.com` |

**Nota:** El nombre de la variable debe empezar con `VITE_` para que Vite la incluya en el frontend. Esta variable se usa tanto para las peticiones API como para cargar imágenes.

### 3.5 Desplegar

1. Haz clic en **"Deploy"**
2. Vercel comenzará a construir y desplegar tu frontend
3. El proceso tarda entre 1 y 3 minutos
4. Cuando termine, verás una página de celebración con la URL de tu sitio

La URL se verá así: `https://paguito-telcel.vercel.app`

### 3.6 Configurar la URL del API en el frontend

El frontend ya está configurado para usar la variable de entorno `VITE_BACKEND_URL`. En el archivo `frontend/src/services/config.ts`:

```typescript
export const BACKEND_URL: string =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';
```

Y en `frontend/src/services/api.ts`, el `baseURL` se ajusta automáticamente:
- **Desarrollo:** Usa `/api` (el proxy de Vite redirige a localhost:3000)
- **Producción:** Usa `${BACKEND_URL}/api` (apunta a tu backend en Render)

No necesitas hacer ningún cambio en el código, solo asegúrate de haber configurado la variable `VITE_BACKEND_URL` en Vercel (Paso 3.4).

---

## Paso 4: Configurar variables de entorno finales

Ahora que tienes las 3 URLs, actualiza las variables de entorno:

### 4.1 Actualizar FRONTEND_URL en Render

1. Ve al panel de Render
2. Haz clic en tu servicio `paguito-telcel-api`
3. Ve a **"Environment"**
4. Busca la variable `FRONTEND_URL`
5. Cámbiala por la URL real de tu frontend en Vercel (ej: `https://paguito-telcel.vercel.app`)
6. Haz clic en **"Save Changes"**
7. Render volverá a desplegar automáticamente (tarda 1-2 minutos)

**Esto es importante porque el backend usa `FRONTEND_URL` para configurar CORS. Si no lo actualizas, el frontend no podrá comunicarse con el backend.**

---

## Paso 5: Ejecutar la migración de la base de datos

La primera vez que el backend se despliega en Render, necesitas que las tablas se creen en Neon. Esto ya está configurado en el **Start Command** de Render:

```
npx prisma migrate deploy && npm start
```

Esto significa que cada vez que Render inicia tu servicio, primero ejecuta las migraciones de Prisma y luego arranca el servidor.

**Sin embargo, si es la primera vez y quieres verificar manualmente:**

1. Ve al panel de Render
2. Haz clic en tu servicio `paguito-telcel-api`
3. Ve a la pestaña **"Shell"** (shell interactiva)
4. Ejecuta: `npx prisma migrate deploy`
5. Deberías ver un mensaje indicando que las migraciones se aplicaron correctamente

### 5.1 Cargar datos iniciales (seed)

Si quieres cargar los datos de prueba (vendedores, productos, etc.):

1. En la Shell de Render, ejecuta: `npx prisma db seed`
2. Esto creará el usuario admin, vendedores y productos de prueba

---

## Paso 6: Verificar que todo funciona

### 6.1 Verificar el backend

1. Abre tu navegador
2. Ve a `https://paguito-telcel-api.onrender.com/api/health`
3. Deberías ver una respuesta JSON con el estado del servidor

### 6.2 Verificar el frontend

1. Abre tu navegador
2. Ve a `https://paguito-telcel.vercel.app`
3. Deberías ver la página principal de Paguito Telcel
4. Intenta navegar por el catálogo de productos
5. Intenta crear una reserva de prueba

### 6.3 Verificar la conexión frontend-backend

1. Abre las herramientas de desarrollador del navegador (F12)
2. Ve a la pestaña **"Network"** (Red)
3. Interactúa con la página (navega, busca productos, etc.)
4. Verifica que las peticiones a `/api/...` muestren respuestas con código 200 (éxito)
5. Si ves errores 403 o CORS, revisa que `FRONTEND_URL` en Render coincida con la URL de Vercel

---

## Despliegue automático desde GitHub

La buena noticia es que **ya está configurado automáticamente**. Tanto Vercel como Render detectan los cambios en GitHub y re-despliegan sin que hagas nada.

### Cómo funciona:

```
Tú haces cambios en tu código local
        ↓
Haces git push a GitHub
        ↓
  ┌─────┴─────┐
  ↓           ↓
Vercel      Render
(detecta    (detecta
 el push)    el push)
  ↓           ↓
Construye   Construye
 el          el
frontend    backend
  ↓           ↓
Despliega   Despliega
```

### Qué pasa en cada push:

1. **Vercel** detecta el push, construye el frontend y lo despliega en ~1-3 minutos
2. **Render** detecta el push, construye el backend y lo despliega en ~2-5 minutos
3. No necesitas hacer nada adicional

### Para probar el despliegue automático:

1. Haz un cambio pequeño en tu código (ej: cambia un texto en la página principal)
2. Haz commit y push:
   ```bash
   git add .
   git commit -m "Cambio de prueba para despliegue automático"
   git push origin main
   ```
3. Ve a los dashboards de Vercel y Render
4. Verás que automáticamente están construyendo y desplegando

### Ramas de despliegue

Por defecto, tanto Vercel como Render despliegan desde la rama `main`. Si quieres cambiar esto:

**En Vercel:**
1. Ve a tu proyecto → **Settings** → **Git**
2. En **"Production Branch"**, cambia la rama

**En Render:**
1. Ve a tu servicio → **Settings**
2. En **"Branch"**, cambia la rama

### Despliegues de preview (opcional)

**Vercel** crea despliegues de preview automáticos para cada Pull Request. Esto te permite probar cambios antes de fusionarlos a `main`.

**Render** en el plan gratuito no tiene esta función, pero puedes configurarla si actualizas a un plan de pago.

---

## Solución de problemas comunes

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa:** La variable `FRONTEND_URL` en Render no coincide con la URL real de tu frontend en Vercel.

**Solución:**
1. Copia la URL exacta de tu frontend en Vercel (ej: `https://paguito-telcel.vercel.app`)
2. Ve a Render → tu servicio → Environment
3. Actualiza `FRONTEND_URL` con esa URL exacta (sin barra al final)
4. Guarda y espera a que Render re-despliegue

### Error: "Database connection failed"

**Causa:** La cadena de conexión de Neon es incorrecta o no usa el pooler.

**Solución:**
1. Ve a Neon → Dashboard
2. Activa **"Pooled connection"**
3. Copia la nueva cadena de conexión
4. Actualiza `DATABASE_URL` en Render
5. Asegúrate de que la cadena termine con `?sslmode=require`

### Error: "Module not found" al construir en Render

**Causa:** Falta alguna dependencia o el `Root Directory` está mal configurado.

**Solución:**
1. Verifica que `Root Directory` sea `backend`
2. Verifica que el `Build Command` sea: `npm install && npx prisma generate && npm run build`
3. Verifica que tu `package.json` tenga todas las dependencias necesarias

### El frontend no carga datos del backend

**Causa:** La variable `VITE_BACKEND_URL` no está configurada o es incorrecta.

**Solución:**
1. Ve a Vercel → tu proyecto → Settings → Environment Variables
2. Verifica que `VITE_BACKEND_URL` tenga la URL correcta de Render (ej: `https://paguito-telcel-api.onrender.com`)
3. Asegúrate de que NO tenga barra al final
4. Después de cambiar variables en Vercel, necesitas **re-desplegar**:
   - Ve a **Deployments**
   - Haz clic en los 3 puntos del despliegue más reciente
   - Haz clic en **"Redeploy"**

### Render se duerme (cold start)

**Causa:** En el plan gratuito, Render "duerme" el servicio después de 15 minutos de inactividad.

**Efecto:** La primera petición después de que se duerme tarda 30-60 segundos en responder.

**Soluciones:**
1. **Aceptar el delay:** Es normal y el servicio responde después
2. **Actualizar a un plan de pago:** Render Starter ($7/mes) no se duerme
3. **Usar un servicio de keep-alive:** Puedes usar un servicio externo que haga ping a tu API cada 10 minutos

### Las imágenes de productos no se cargan

**Causa:** Las imágenes se guardan localmente en el servidor de Render, y cada vez que Render re-despliega, se pierden.

**Solución a largo plazo:** Configurar un servicio de almacenamiento en la nube como Cloudinary o AWS S3. Las variables de entorno ya están preparadas en el `.env.example`.

---

## Resumen de URLs finales

Después de completar el despliegue, tendrás:

| Servicio | URL |
|---|---|
| **Frontend** | `https://paguito-telcel.vercel.app` |
| **Backend API** | `https://paguito-telcel-api.onrender.com` |
| **Base de datos** | (solo accesible desde Render, no tiene URL pública) |

---

## Resumen de costos

| Servicio | Plan | Costo mensual |
|---|---|---|
| **Neon** | Free | $0 (0.5 GB de almacenamiento) |
| **Render** | Free | $0 (se duerme después de 15 min) |
| **Vercel** | Hobby | $0 (uso personal) |
| **Total** | | **$0/mes** |

Si necesitas más rendimiento:

| Servicio | Plan | Costo mensual |
|---|---|---|
| **Neon** | Launch | $0 (1 GB de almacenamiento) |
| **Render** | Starter | $7/mes (no se duerme) |
| **Vercel** | Hobby | $0 |
| **Total** | | **$7/mes** |

---

## Comandos útiles

```bash
# Generar claves secretas (ejecutar en tu terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Verificar que el backend responde
curl https://paguito-telcel-api.onrender.com/api/health

# Ver logs en Render (desde el dashboard)
# Ve a tu servicio → Logs

# Re-desplegar manualmente en Render
# Ve a tu servicio → Manual Deploy → Deploy latest commit

# Re-desplegar manualmente en Vercel
# Ve a Deployments → ... → Redeploy
```
