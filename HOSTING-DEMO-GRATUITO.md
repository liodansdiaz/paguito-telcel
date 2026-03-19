# 🆓 HOSTING GRATUITO PARA DEMO - PAGUITO TELCEL

## 🎯 OBJETIVO

Deployar la aplicación de forma **GRATUITA** para mostrar a superiores/inversionistas sin invertir dinero aún.

**Restricciones:**
- Presupuesto: $0 USD
- Tiempo de setup: Máximo 1 día
- Propósito: Demo funcional (no producción real)
- Duración: 1-3 meses de prueba

---

## 🏆 OPCIÓN RECOMENDADA: RENDER (Plan Gratuito)

### ✅ Por Qué Render

**Ventajas:**
- ✅ Completamente gratis (sin tarjeta de crédito)
- ✅ Todo en una plataforma (frontend + backend + DB + Redis)
- ✅ Deploy automático desde GitHub
- ✅ PostgreSQL incluido gratis
- ✅ Redis incluido gratis
- ✅ SSL/HTTPS automático
- ✅ Logs accesibles
- ✅ No expira (mientras uses la app mensualmente)

**Desventajas:**
- ⚠️ **Spin-down después de 15 minutos de inactividad**
  - Primera request después de inactividad tarda ~30-60 segundos en despertar
  - Solución temporal: Servicio externo de "ping" cada 14 minutos (ver más abajo)
- ⚠️ PostgreSQL gratis: límite de 90 días, luego se borra (suficiente para demo)
- ⚠️ Redis gratis: solo 25 MB (suficiente para demo)

**Veredicto:** Ideal para mostrar a jefes. El spin-down es molesto pero no crítico para una demo.

---

### 📋 GUÍA PASO A PASO - RENDER

#### **PASO 1: Preparar el Repositorio**

1. Asegurate que tu código esté en GitHub (privado o público)

2. Crear archivo `render.yaml` en la raíz del proyecto:

```yaml
# render.yaml
services:
  # Backend API
  - type: web
    name: paguito-backend
    runtime: node
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: paguito-db
          property: connectionString
      - key: REDIS_HOST
        fromService:
          name: paguito-redis
          type: redis
          property: host
      - key: REDIS_PORT
        fromService:
          name: paguito-redis
          type: redis
          property: port
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: FRONTEND_URL
        sync: false # Configurar manualmente después
      - key: GROQ_API_KEY
        sync: false # Tu API key de Groq
    healthCheckPath: /health

  # Frontend (Static Site)
  - type: web
    name: paguito-frontend
    runtime: static
    plan: free
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

# Database
databases:
  - name: paguito-db
    databaseName: paguito_telcel
    plan: free
    user: paguito

# Redis (opcional, pero recomendado)
# Nota: Redis gratis solo está disponible en región Oregon
```

3. Modificar `frontend/vite.config.ts` para proxy en desarrollo (ya debería estar):

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

4. Crear `.env.production` en `frontend/` (NO commitear):

```env
VITE_API_URL=https://paguito-backend.onrender.com
```

5. Commitear y pushear a GitHub:

```bash
git add .
git commit -m "feat: configurar deploy en Render"
git push
```

---

#### **PASO 2: Crear Cuenta en Render**

1. Ve a: https://render.com
2. Click en "Get Started for Free"
3. Conectar con GitHub (autorizar acceso al repo)

---

#### **PASO 3: Crear Servicios**

**Opción A: Blueprint (Automático desde render.yaml)**

1. Dashboard → "New" → "Blueprint"
2. Seleccionar tu repo `paguito-telcel`
3. Render detecta `render.yaml` automáticamente
4. Click "Apply"
5. Esperar ~10-15 minutos mientras crea todo

**Opción B: Manual (si render.yaml no funciona)**

**3.1 Crear Base de Datos:**
1. Dashboard → "New" → "PostgreSQL"
2. Name: `paguito-db`
3. Database: `paguito_telcel`
4. User: `paguito`
5. Region: Oregon (tiene plan gratis)
6. Plan: **Free** (⚠️ Expira en 90 días)
7. Click "Create Database"
8. Copiar **Internal Database URL** (la usarás después)

**3.2 Crear Redis (Opcional):**
1. Dashboard → "New" → "Redis"
2. Name: `paguito-redis`
3. Plan: **Free** (25 MB)
4. Region: Oregon
5. Click "Create Redis"

**3.3 Crear Backend (Web Service):**
1. Dashboard → "New" → "Web Service"
2. Conectar GitHub → Seleccionar repo `paguito-telcel`
3. Name: `paguito-backend`
4. Region: Oregon
5. Branch: `main`
6. Root Directory: `backend`
7. Runtime: Node
8. Build Command: `npm install && npm run build`
9. Start Command: `npm start`
10. Plan: **Free**
11. **Environment Variables** (click "Advanced"):

```env
NODE_ENV=production
PORT=3000

# Database (copiar de la DB que creaste)
DATABASE_URL=postgresql://paguito:...@oregon-postgres.render.com/paguito_telcel

# JWT (generar con npm run generate-secrets y copiar)
JWT_SECRET=<tu-secret-generado>
JWT_REFRESH_SECRET=<tu-refresh-secret-generado>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (ajustar después con la URL que Render te asigne)
FRONTEND_URL=https://paguito-telcel.onrender.com

# Redis (si lo creaste)
REDIS_ENABLED=true
REDIS_HOST=paguito-redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Gmail para demo - NO para producción)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=tu-app-password-de-gmail
EMAIL_FROM=Paguito Telcel <tu-correo@gmail.com>

# Notificaciones (solo email para demo)
NOTIFICATIONS_EMAIL=true
NOTIFICATIONS_WHATSAPP=false
NOTIFICATIONS_INTERNAL=true

# Groq (para el chat)
GROQ_API_KEY=<tu-groq-api-key>
```

12. Health Check Path: `/health`
13. Click "Create Web Service"
14. Esperar ~5-10 minutos a que compile y deploye
15. **Copiar la URL asignada:** `https://paguito-backend.onrender.com`

**3.4 Aplicar Migraciones de DB:**

Una vez que el backend esté deployed:

1. Ve a la dashboard del backend service
2. Click en "Shell" (terminal remota)
3. Ejecutar:

```bash
cd backend
npm run db:migrate:deploy  # Aplicar migraciones
npm run db:seed            # Cargar datos iniciales (admin, vendedores)
```

**3.5 Crear Frontend (Static Site):**
1. Dashboard → "New" → "Static Site"
2. Conectar GitHub → Seleccionar repo `paguito-telcel`
3. Name: `paguito-telcel`
4. Branch: `main`
5. Root Directory: `frontend`
6. Build Command: `npm install && npm run build`
7. Publish Directory: `dist`
8. **Environment Variables:**

```env
VITE_API_URL=https://paguito-backend.onrender.com
```

9. Click "Create Static Site"
10. Esperar ~5 minutos
11. **Copiar la URL asignada:** `https://paguito-telcel.onrender.com`

**3.6 Actualizar FRONTEND_URL en Backend:**
1. Ve al backend service
2. Environment → Editar `FRONTEND_URL`
3. Cambiar a: `https://paguito-telcel.onrender.com`
4. Guardar (esto redeploya automáticamente)

---

#### **PASO 4: Configurar CORS y Variables Finales**

1. Verificar que `backend/src/app.ts` tenga:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

2. Si hiciste cambios, commitear y pushear (Render redeploya automáticamente)

---

#### **PASO 5: Verificar que Funciona**

1. Abrir: `https://paguito-telcel.onrender.com`
2. Debería cargar el home (esperar ~30 seg en primera carga si estaba dormido)
3. Probar login con credenciales del seed:
   - Email: `admin@paguito.com`
   - Password: `Admin123!`
4. Crear una reserva de prueba
5. Verificar que el email llegue (si configuraste Gmail)

---

#### **PASO 6: Prevenir Spin-Down (Opcional pero Recomendado)**

El plan gratuito de Render hace "sleep" después de 15 minutos de inactividad. Para evitar esto durante la demo:

**Opción A: Cron-job.org (Gratis)**

1. Crear cuenta en: https://cron-job.org/en/
2. Crear nuevo cron job:
   - URL: `https://paguito-backend.onrender.com/health`
   - Schedule: Cada 14 minutos
   - Enabled: ✅
3. Guardar

**Opción B: UptimeRobot (Gratis)**

1. Crear cuenta en: https://uptimerobot.com
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: `https://paguito-backend.onrender.com/health`
   - Monitoring Interval: 5 minutos
3. Guardar

**Opción C: Script Local (mientras estés trabajando)**

```bash
# keep-alive.sh
while true; do
  curl https://paguito-backend.onrender.com/health
  sleep 840  # 14 minutos
done
```

```bash
chmod +x keep-alive.sh
./keep-alive.sh &
```

---

### 💰 COSTO

**$0 USD / mes**

**Limitaciones a considerar:**
- PostgreSQL se borra después de 90 días (suficiente para demo)
- Spin-down después de 15 min (solucionado con ping)
- 512 MB RAM backend (puede ser lento con muchos usuarios simultáneos)
- 100 GB bandwidth/mes (suficiente para 1000-2000 visitas)

---

## 🥈 OPCIÓN ALTERNATIVA 1: RAILWAY (Plan Gratis)

### ✅ Ventajas sobre Render

- ✅ **SIN spin-down** (mejor UX)
- ✅ PostgreSQL sin límite de tiempo
- ✅ Redis incluido gratis
- ✅ Mejor developer experience (logs, metrics)

### ❌ Desventajas

- ⚠️ Solo $5 USD de crédito gratis (dura ~1 mes)
- ⚠️ Requiere tarjeta de crédito (aunque no te cobran hasta agotar crédito)

### 📋 Setup Rápido

1. Crear cuenta: https://railway.app
2. New Project → Deploy from GitHub
3. Seleccionar repo `paguito-telcel`
4. Railway detecta automáticamente backend y frontend
5. Add PostgreSQL database
6. Add Redis
7. Configurar variables de entorno (igual que Render)
8. Deploy

**Tiempo total:** 30 minutos

**Duración del crédito gratuito:**
- Backend: ~$3/mes
- PostgreSQL: ~$1/mes
- Redis: ~$0.50/mes
- Frontend: $0 (static)
- **Total: $4.50/mes → crédito gratis dura ~1 mes**

---

## 🥉 OPCIÓN ALTERNATIVA 2: VERCEL (Frontend) + RENDER (Backend)

### ✅ Ventajas

- ✅ Frontend en Vercel: CDN global ultra-rápido
- ✅ Backend en Render: gratis con DB
- ✅ Mejor performance para usuarios finales

### ❌ Desventajas

- ⚠️ Configuración en dos plataformas (más complejo)
- ⚠️ Backend sigue teniendo spin-down

### 📋 Setup Rápido

**Frontend en Vercel:**
1. Crear cuenta: https://vercel.com
2. Import Git Repository → Seleccionar repo
3. Framework Preset: Vite
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variables:
   ```
   VITE_API_URL=https://paguito-backend.onrender.com
   ```
8. Deploy

**Backend en Render:**
- Seguir pasos de la sección anterior (solo backend + DB)

**Tiempo total:** 45 minutos

---

## 🆓 OPCIÓN ALTERNATIVA 3: FLY.IO (Plan Gratis)

### ✅ Ventajas

- ✅ SIN spin-down (máquinas siempre activas)
- ✅ PostgreSQL incluido gratis
- ✅ Deploy con Docker (más control)
- ✅ Edge computing (baja latencia global)

### ❌ Desventajas

- ⚠️ Requiere Dockerfile (más técnico)
- ⚠️ CLI obligatorio (no hay UI web completa)
- ⚠️ Curva de aprendizaje más alta

### 📋 Setup Rápido

**Prerequisitos:**
```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth signup
```

**Backend:**
```bash
cd backend

# Crear app
fly launch --name paguito-backend --region mia

# Crear PostgreSQL
fly postgres create --name paguito-db --region mia

# Attach DB
fly postgres attach paguito-db

# Deploy
fly deploy

# Aplicar migraciones
fly ssh console
npm run db:migrate:deploy
npm run db:seed
```

**Frontend:**
```bash
cd frontend

# Build estático
npm run build

# Deploy a Vercel o Netlify (Fly no tiene static site gratis)
```

**Tiempo total:** 1-2 horas (si conocés Docker)

---

## 📊 COMPARACIÓN DIRECTA

| Feature | Render | Railway | Vercel+Render | Fly.io |
|---------|--------|---------|---------------|--------|
| **Costo** | $0 | $0 (1 mes) | $0 | $0 |
| **Spin-down** | ✅ Sí (15 min) | ❌ No | Frontend: No<br>Backend: Sí | ❌ No |
| **DB Incluido** | ✅ 90 días | ✅ Ilimitado | ✅ 90 días | ✅ Ilimitado |
| **Setup** | 🟢 Fácil | 🟢 Fácil | 🟡 Medio | 🔴 Difícil |
| **Tarjeta Requerida** | ❌ No | ⚠️ Sí | ❌ No | ❌ No |
| **Duración** | ♾️ Ilimitado | 1 mes | ♾️ Ilimitado | ♾️ Ilimitado |
| **SSL/HTTPS** | ✅ Automático | ✅ Automático | ✅ Automático | ✅ Automático |
| **Logs** | ✅ Sí | ✅ Mejores | ✅ Sí | ✅ Sí |
| **Performance** | 6/10 | 8/10 | 9/10 | 8/10 |
| **Mejor para** | Demo rápida | MVP serio | Performance | Devs avanzados |

---

## 🏆 MI RECOMENDACIÓN FINAL

### **Para Mostrar a Superiores ESTA SEMANA:**

**RENDER (Opción 1)**

**Por qué:**
- Setup en 1-2 horas
- No necesitás tarjeta de crédito
- Todo en un solo lugar (menos confusión)
- Gratis para siempre (mientras uses la app mensualmente)

**Advertencia para la demo:**
- Avisar que la primera carga puede tardar 30 seg (spin-down)
- Configurar cron-job.org para mantenerlo despierto durante la presentación
- 1 día antes de la demo, hacer 5-10 requests para verificar que funciona

---

### **Si Tenés 1 Día Más y Querés Mejor Performance:**

**VERCEL (Frontend) + RENDER (Backend)**

**Por qué:**
- Frontend ULTRA-RÁPIDO en Vercel (impresiona a los jefes)
- Backend gratis en Render (con spin-down pero menos notorio)

---

### **Si Querés Algo Más Serio (y tenés tarjeta):**

**RAILWAY**

**Por qué:**
- Sin spin-down (UX perfecta)
- $5 gratis te dura 1 mes completo
- Si la demo va bien y quieren seguir, solo pagás $5-10/mes

---

## 🚀 PLAN DE ACCIÓN PARA HOY

### **Opción Render (Recomendada):**

**09:00-10:00** → Crear cuenta Render + conectar GitHub
**10:00-11:00** → Crear DB + Redis + Backend service
**11:00-11:30** → Aplicar migraciones + seed
**11:30-12:00** → Crear frontend static site
**12:00-12:30** → Verificar que funciona + fix bugs
**12:30-13:00** → Configurar cron-job.org para keep-alive
**13:00-14:00** → Testing completo (crear reserva, login admin, etc.)
**14:00-15:00** → Preparar presentación con screenshots

**Tiempo total: 6 horas**

---

## 📝 CHECKLIST PRE-DEMO

### **1 Día Antes de la Presentación:**

- [ ] Hacer 10 requests al backend para despertarlo
- [ ] Verificar que cron-job.org está activo
- [ ] Crear 2-3 reservas de prueba con datos realistas
- [ ] Crear 2-3 productos con imágenes de celulares reales
- [ ] Verificar que el chat funciona (Groq API key configurada)
- [ ] Verificar que los emails se envían (Gmail configurado)
- [ ] Testing en navegador incógnito (para simular usuario nuevo)
- [ ] Testing en móvil (para mostrar responsive design)
- [ ] Tener credenciales de admin anotadas:
  - Email: `admin@paguito.com`
  - Password: `Admin123!`

### **1 Hora Antes de la Presentación:**

- [ ] Abrir la app en una tab (para pre-cargar)
- [ ] Verificar que no hay errores en consola del navegador
- [ ] Hacer 1 reserva de prueba para verificar flujo completo
- [ ] Tener pantalla de login admin ya abierta (para no perder tiempo)
- [ ] Cerrar todas las tabs innecesarias (para mejor performance)

### **Durante la Presentación:**

- [ ] Si ves spin-down (carga lenta), mencionar:
  > "Esto es una demo en infraestructura gratuita. En producción, el tiempo de respuesta será instantáneo."
- [ ] Tener screenshots de backup por si el internet falla
- [ ] Mostrar flujo completo:
  1. Home → Catálogo
  2. Agregar productos al carrito
  3. Crear reserva (con datos ficticios)
  4. Login como admin
  5. Ver reserva en dashboard
  6. Mostrar mapa del vendedor
  7. Mostrar chat con IA (wow factor)

---

## 🔧 TROUBLESHOOTING COMÚN

### **Error: "Application failed to respond"**

**Causa:** Spin-down, esperá 30-60 segundos.

**Solución:**
- Configurar cron-job.org
- O avisar en la demo que es normal

---

### **Error: "Database connection failed"**

**Causa:** Variable `DATABASE_URL` mal configurada.

**Solución:**
1. Ve a Render dashboard → PostgreSQL
2. Copiar **Internal Database URL**
3. Pegar en backend Environment → `DATABASE_URL`
4. Redeploy

---

### **Error: "CORS policy blocked"**

**Causa:** `FRONTEND_URL` en backend no coincide con URL real del frontend.

**Solución:**
1. Copiar URL del frontend static site
2. Pegar en backend Environment → `FRONTEND_URL`
3. Redeploy backend

---

### **Error: Imágenes no cargan**

**Causa:** Las imágenes están en `backend/uploads/` (no se incluyen en deploy).

**Solución temporal para demo:**
1. Usar URLs de imágenes externas (ej: enlaces de Google Images)
2. O subir imágenes manualmente después del deploy

**Solución permanente:**
- Migrar a Cloudinary (ver documento ANALISIS-PRODUCCION.md)

---

### **Error: Chat no responde**

**Causa:** `GROQ_API_KEY` no configurada o inválida.

**Solución:**
1. Obtener API key: https://console.groq.com/keys
2. Pegar en backend Environment → `GROQ_API_KEY`
3. Redeploy

---

## 💡 TIPS PARA IMPRESIONAR EN LA DEMO

### **1. Datos Realistas**

En lugar de "Test User" y "test@test.com", usá:
- Nombres: "María García López", "Juan Pérez Hernández"
- CURPs válidos (generador: https://www.curp.mx)
- Direcciones reales de Tapachula
- Productos con imágenes HD de celulares reales

### **2. Storytelling**

En vez de mostrar funcionalidades al azar:

> "Imaginen a María, una clienta de Tapachula que quiere un iPhone 15 a crédito. Ella entra a nuestra plataforma..."

Luego recorrés el flujo como María.

### **3. Highlight del Chat con IA**

El chat con Groq es tu diferenciador. Mostralo último para cerrar con impacto:

> "Y aquí viene la magia: tenemos un asistente con IA que responde preguntas en tiempo real sobre nuestros productos..."

### **4. Métricas en Dashboard**

Antes de la demo, creá suficientes reservas de prueba para que el dashboard se vea poblado:
- 15-20 reservas con diferentes estados
- 3-4 vendedores con reservas asignadas
- Productos variados (iPhone, Samsung, Xiaomi)

Esto hace que se vea como un sistema en uso real.

### **5. Ten un Plan B**

Si el internet falla o Render se cae:
- Screenshots en alta resolución de cada pantalla
- Video grabado del flujo completo (2-3 minutos)
- Presentación PDF con capturas + explicación

---

## 📱 BONUS: ¿Cómo Compartir la URL?

### **Opción A: URL Directa**

Simplemente: `https://paguito-telcel.onrender.com`

**Pros:** Inmediato
**Contras:** URL genérica (no muy profesional)

### **Opción B: Dominio Custom (Gratis con Freenom)**

1. Registrar dominio gratis en: https://www.freenom.com
   - Buscar: `paguitotelcel.tk` (o .ml, .ga, .cf, .gq)
   - Registrar gratis por 12 meses
2. Configurar DNS:
   - Type: CNAME
   - Name: @
   - Target: `paguito-telcel.onrender.com`
3. En Render dashboard → Settings → Custom Domains
   - Agregar: `paguitotelcel.tk`
4. Esperar 5-10 minutos a que propague

**Pros:** URL profesional
**Contras:** 30 min de setup, dominio .tk no inspira confianza

### **Opción C: Dominio Real ($12/año)**

Si querés REALMENTE impresionar:
1. Comprar dominio en Namecheap/GoDaddy: `paguito-telcel.com`
2. Configurar DNS igual que opción B
3. Ahora tenés: `https://paguito-telcel.com`

**Costo:** $12 USD/año
**Impacto:** Profesional 100%

---

## ⏰ RESUMEN: PLAN DE 1 DÍA

```
┌──────────────────────────────────────────────────────┐
│   DEPLOY GRATIS PARA DEMO - TIMELINE 1 DÍA          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  HORA 1-2: Setup Inicial                            │
│  ├─ Crear cuenta Render                            │
│  ├─ Conectar GitHub                                 │
│  ├─ Crear PostgreSQL database                       │
│  └─ Crear Redis (opcional)                          │
│                                                      │
│  HORA 3-4: Deploy Backend                           │
│  ├─ Crear web service (backend)                     │
│  ├─ Configurar variables de entorno                 │
│  ├─ Esperar deploy                                  │
│  ├─ Aplicar migraciones                             │
│  └─ Seed con datos iniciales                        │
│                                                      │
│  HORA 5: Deploy Frontend                            │
│  ├─ Crear static site                               │
│  ├─ Configurar VITE_API_URL                         │
│  └─ Esperar deploy                                  │
│                                                      │
│  HORA 6: Testing                                    │
│  ├─ Verificar login admin                           │
│  ├─ Crear reserva de prueba                         │
│  ├─ Verificar dashboard                             │
│  ├─ Probar chat                                     │
│  └─ Fix bugs                                        │
│                                                      │
│  HORA 7: Keep-Alive                                 │
│  ├─ Configurar cron-job.org                         │
│  └─ Verificar que previene spin-down                │
│                                                      │
│  HORA 8: Preparación Demo                           │
│  ├─ Crear datos realistas                           │
│  ├─ Screenshots de backup                           │
│  └─ Practicar presentación                          │
│                                                      │
│  ✅ LISTO PARA MOSTRAR                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🎬 PRÓXIMOS PASOS DESPUÉS DE LA DEMO

### **Si les gusta y quieren seguir:**

1. **Semana 1:** Migrar a Railway ($10/mes, sin spin-down)
2. **Semana 2:** Implementar WhatsApp API (crítico)
3. **Semana 3:** Migrar imágenes a Cloudinary
4. **Semana 4:** Deploy a producción real

### **Si necesitan más tiempo de evaluación:**

- Render gratis te dura indefinidamente
- Solo recordá que la DB se borra a los 90 días
- Hacé backup manual antes de que expire

---

## 🔥 MENSAJE FINAL

Dejate de vueltas y deployá HOY MISMO a Render. No necesitás perfección, necesitás que tus jefes vean que el sistema FUNCIONA.

**6 horas de laburo y tenés una URL que podés compartir.**

Después pulís, mejorás, migrás a infraestructura paga. Pero AHORA lo importante es mostrar valor.

**Dale que va. 🚀**

---

**Autor:** Claude (Senior Architect)  
**Fecha:** Marzo 2026  
**Versión:** 1.0
