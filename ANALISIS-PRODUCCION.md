# Análisis de Gaps para Producción - Paguito Telcel

**Fecha:** 2 de abril de 2026  
**Alcance:** Revisión completa de backend, frontend, infraestructura y configuración  
**Actualizado por:** Análisis exhaustivo del código fuente actual

---

## Estado Actual - Lo que YA está implementado

### Backend (42 endpoints en 7 módulos)

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| Auth | 6 | Login, refresh, logout, forgot/reset password, me |
| Products | 12 | CRUD admin + catálogo público con filtros, marcas, colores, memorias |
| Reservations | 16 | Crear, consultar, cancelar, modificar, asignar vendedor, estados, items |
| Customers | 3 | Listado, detalle, bloquear/activar |
| Users | 6 | CRUD vendedores y administradores |
| Dashboard | 6 | Métricas admin, charts, distribución estados, ranking vendedores, dashboard vendedor |
| Chat | 1 | Asistente IA con Groq/Llama 3.3 70B streaming SSE |

### Servicios Compartidos

- **Email** - Nodemailer con Gmail SMTP
- **WhatsApp** - Evolution API con normalización de números mexicanos
- **Notificaciones** - Orquestador que envía por email, WhatsApp e interna en paralelo
- **Round Robin** - Asignación automática de vendedores por `lastAssignedAt`
- **Cache** - Redis con fallback a memoria (soporta invalidación por patrón)
- **Cloudinary** - Configurado para imágenes de productos
- **Daily Summary** - Resumen diario por email a admins via cron job
- **Schedule Validator** - Valida horarios de atención

### Middleware

- `authenticate` - Verificación JWT
- `requireRole()` - Autorización por rol (ADMIN, VENDEDOR)
- `errorMiddleware` - Manejo centralizado de errores (AppError, ZodError, Prisma)
- `uploadMiddleware` - Multer para imágenes (max 3, max 5MB)

### Configuración

- Rate limiting (login, refresh, reservations, chat) con soporte Redis
- JWT con access token (15 min) + refresh token (7 días)
- Validación de variables de entorno al inicio
- Graceful shutdown (SIGTERM, SIGINT)
- Helmet para seguridad HTTP
- CORS configurado
- Compresión de respuestas
- Morgan para logging HTTP

### Tests Backend

12 archivos de test unitarios:
- auth.service.test.ts
- cache.service.test.ts
- customer.service.test.ts
- dashboard.service.test.ts
- email.service.test.ts
- notification.service.test.ts
- product.service.test.ts
- reservation.service.test.ts
- roundrobin.service.test.ts
- schedule.validator.test.ts
- user.service.test.ts
- whatsapp.service.test.ts

### Frontend (20 páginas)

**Páginas públicas (8):**
- Home - Landing con hero, populares, ofertas, testimonios
- Catalog - Catálogo con filtros, scroll infinito
- ProductDetail - Detalle con galería, selectores color/memoria/pago
- CartCheckout - Carrito + formulario de reserva con mapa Leaflet
- ReservationSuccess - Confirmación post-reserva
- FAQ - 14 preguntas en 4 categorías
- Nosotros - Página institucional
- MiReserva - Consulta/cancelación/modificación por folio o CURP

**Páginas auth (3):**
- Login - Email/password con redirección por rol
- ForgotPassword - Solicitar recuperación por email
- ResetPassword - Crear nueva contraseña con token

**Páginas admin (7):**
- AdminDashboard - 10 KPIs, gráficas de línea, pie y barra
- ReservationsManager - CRUD reservas con filtros avanzados
- CustomersDirectory - Listado de clientes con filtros
- CustomerProfile - Detalle de cliente con historial
- VendorsManager - CRUD vendedores con modal de reservas
- AdminsManager - CRUD administradores
- InventoryManager - CRUD productos con imágenes

**Páginas vendedor (1):**
- VendorDashboard - Mapa Leaflet + lista de reservas asignadas

**Componentes:**
- 3 layouts (Public, Admin, Vendor)
- ChatWidget (asistente IA flotante)
- Carrito, Logo, Pagination, StatusBadge
- AdminPageLayout reutilizable
- ErrorBoundary, RouteErrorBoundary, LoadingFallback

**State Management:**
- `auth.store.ts` - Zustand con persistencia (usuario, tokens en memoria)
- `carrito.store.ts` - Zustand con persistencia (items, reservas confirmadas)

---

## Lo que FALTA - Por Prioridad (ACTUALIZADO 02/04/2026)

> **NOTA:** Análisis realizado revisando el código fuente actual.
> Los estados marcados con ✅ fueron verificados como resueltos en el código.

### CRITICO (bloquea producción)

#### 1. ✅ DOCKERFILES - RESUELTO

**Problema:** No había Dockerfiles para deployar.

**Resolución (31/03/2026):**
- ✅ `backend/Dockerfile` - Multi-stage build (deps → prisma → build → production)
- ✅ `frontend/Dockerfile` - Multi-stage build (node → nginx)
- ✅ `frontend/nginx.conf` - Configuración Nginx para SPA + proxy /api
- ✅ `backend/.dockerignore` y `frontend/.dockerignore`
- ✅ `docker-compose.yml` actualizado con 6 servicios (postgres, redis, evolution-postgres, evolution-api, backend, frontend)
- ✅ `.env.docker` creado con todas las variables de entorno
- ✅ `deploy.sh` creado para actualizaciones automáticas
- ✅ `evolution-init.sh` creado para auto-setup de WhatsApp

#### 2. ✅ .env DEL FRONTEND - RESUELTO

**Problema:** No había .env para el frontend en producción.

**Resolución (31/03/2026):** El `frontend/Dockerfile` usa `VITE_BACKEND_URL=/api` como argumento de build. En producción, el frontend se sirve desde el mismo dominio que el backend, así que las llamadas a `/api` van al backend via Nginx proxy. No se necesita .env separado.

#### 3. ✅ PROXY DE VITE - RESUELTO

**Problema:** No había proxy configurado en vite.config.ts.

**Resolución (31/03/2026):** Se verificó que `vite.config.ts` YA tiene el proxy configurado:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```
En producción, Nginx hace el proxy (ver `nginx.conf`).

#### 4. ✅ CORS EN PRODUCCION - RESUELTO

**Problema:** CORS solo permitía FRONTEND_URL.

**Resolución (31/03/2026):** En la arquitectura Docker, el frontend y backend están en la misma máquina. Nginx sirve el frontend en puerto 80 y proxya `/api` al backend en puerto 3000. Las llamadas del navegador van a la misma IP/puerto, así que CORS no es un problema. La variable `FRONTEND_URL` en `.env` se configura con la IP pública del servidor.

---

### ALTA (seguridad y operación)

#### 5. ✅ RATE LIMITER CON REDIS - RESUELTO

**Problema:** El rate limiting usaba memoria por defecto.

**Estado (02/04/2026):** ✅ **RESUELTO**
- Redis está incluido en docker-compose.yml con healthcheck
- El backend tiene soporte completo para Redis rate limiting (`rate-limit-redis`)
- La configuración en `rateLimit.ts` detecta automáticamente si Redis está disponible
- Solo falta activarlo poniendo `REDIS_ENABLED=true` en el `.env` (configuración, no desarrollo)

#### 6. ✅ REDIS SIN PASSWORD - RESUELTO

**Problema:** En `docker-compose.yml` Redis no tenía contraseña.

**Resolución (02/04/2026):**
- ✅ Se agregó `--requirepass ${REDIS_PASSWORD}` al comando de Redis en docker-compose.yml
- ✅ Se actualizó el healthcheck para usar la contraseña: `redis-cli -a ${REDIS_PASSWORD} ping`
- ✅ Se agregó `REDIS_PASSWORD: ${REDIS_PASSWORD}` a las variables de entorno del backend
- ✅ Se agregó `REDIS_PASSWORD` al archivo `.env.docker` como ejemplo

**Estado actual:** El comando Redis es:
```yaml
command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru --requirepass ${REDIS_PASSWORD}
```

**Para activar:**
1. Generar una contraseña segura: `openssl rand -base64 32`
2. Agregar al `.env`: `REDIS_PASSWORD=tu_contraseña_aquí`
3. Asegurarse que `REDIS_ENABLED=true` en el `.env`

#### 7. ✅ POSTGRES CON CREDENCIALES DE DESARROLLO - RESUELTO

**Problema:** Credenciales hardcodeadas.

**Resolución (31/03/2026):** El `docker-compose.yml` ahora usa variables de entorno para las credenciales de Postgres:
```yaml
POSTGRES_USER: ${DB_USER:-paguito}
POSTGRES_PASSWORD: ${DB_PASSWORD:-paguito123}
```
Se pueden cambiar sin tocar el docker-compose, solo editando el `.env`.

#### 8. ✅ UPLOADS LOCALES vs CLOUDINARY - RESUELTO

**Problema:** Las imágenes se perdían al recrear el contenedor.

**Resolución (31/03/2026):** Se agregó un volumen persistente `backend_uploads:/app/uploads` en docker-compose.yml. Las imágenes ahora sobreviven entre reinicios.

---

### MEDIA (mejoras necesarias)

#### 9. ✅ DEPLOY SCRIPT - RESUELTO (CI/CD pendiente)

**Problema:** No había forma automatizada de deployar.

**Resolución (31/03/2026):** Se creó `deploy.sh` que automatiza el deploy:
- `git pull origin main`
- `docker compose build`
- `docker compose down`
- `docker compose up -d`
- Verifica estado de WhatsApp

**Pendiente:** GitHub Actions para deploy automático al hacer push a main.

#### 10. ✅ LOGGING ESTRUCTURADO CON ROTACIÓN - RESUELTO

**Problema:** El logger existía pero no había configuración de rotación de logs ni forma de verlos desde el admin.

**Resolución (02/04/2026):**
- ✅ Se instaló `winston-daily-rotate-file`
- ✅ Se configuró rotación diaria de logs (máximo 20MB por archivo)
- ✅ Se configuró compresión automática de archivos viejos (.gz)
- ✅ Se configuró retención de 30 días (archivos más viejos se eliminan automáticamente)
- ✅ Se creó endpoint `/api/admin/logs` para leer logs (soporta archivos comprimidos)
- ✅ Se creó página `SystemLogs.tsx` en el admin para ver logs desde el navegador
- ✅ Se agregó menú "Logs del Sistema" en el sidebar del admin
- ✅ Se incluyen filtros por fecha, nivel (error/warn/info/debug) y búsqueda de texto
- ✅ Se incluye descarga de archivos de log
- ✅ Se incluyen estadísticas (errores hoy, warnings hoy, tamaño total)

**Configuración actual:**
```typescript
new winston.transports.DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
})
```

**Funcionalidades del dashboard:**
- Ver logs de hoy (archivo actual)
- Ver logs de cualquier día de los últimos 30 días
- Los archivos comprimidos se descomprimen automáticamente al visualizarlos
- Filtrar por nivel de log (error, warn, info, debug)
- Buscar por texto en los logs
- Descargar cualquier archivo de log
- Ver estadísticas (archivos, tamaño total, errores hoy, warnings hoy)

#### 11. ✅ BACKUP AUTOMÁTICO DE BASE DE DATOS - IMPLEMENTADO (OPCIÓN LOCAL)

**Problema:** No había mecanismo de backup automático de la base de datos.

**Resolución (02/04/2026):**
- ✅ Se creó script de backup local (`backup/backup-local.sh`) que usa `pg_dump` y gzip
- ✅ Se creó script de restauración (`backup/restore-backup.sh`) con confirmación de seguridad
- ✅ Los scripts son ejecutables y funcionan en entornos Linux/WSL/Git Bash
- ✅ El backup se ejecuta mediante `docker exec paguito-postgres pg_dump | gzip`
- ✅ Los backups se guardan en el directorio `./backup/` con nombre `paguito-YYYY-MM-DD_HH-MM-SS.sql.gz`
- ✅ Se elimina automáticamente backups más antiguos de 7 días (configurable)
- ✅ Se incluye verificación de éxito y manejo de errores

**Cómo usar:**
```bash
# Hacer los scripts ejecutables (solo primera vez)
chmod +x backup/backup-local.sh
chmod +x backup/restore-backup.sh

# Ejecutar backup manual
./backup/backup-local.sh

# Restaurar un backup
./backup/restore-backup.sh
# Luego seleccionar el backup cuando se solicite
```

**Para automatizar en producción (Linux/Unix):**
1. Agregar un cron job que ejecute el backup diario:
   ```bash
   crontab -e
   # Agregar esta línea (ejecutar todos los días a las 2:00 AM)
   0 2 * * * /ruta/al/proyecto/backup/backup-local.sh >> /ruta/al/proyecto/backup/backup.log 2>&1
   ```

**Para automatizar en Windows (usando Git Bash o WSL):**
1. Abrir Git Bash como Administrador
2. Ejecutar: `crontab -e`
3. Agregar esta línea:
   ```
   0 2 * * * /c/Repo/Mexico/Amigos\ Paguito\ Telcel/paguito-telcel/backup/backup-local.sh >> /c/Repo\Mexico/Amigos\ Paguito\ Telcel/paguito-telcel/backup/backup.log 2>&1
   ```
   (Ajustar la ruta según la instalación)

**Configuración actual en el script:**
- Directorio de backups: `./backup/`
- Retención: 7 días (modificable en el script)
- Compresión: gzip
- Base de datos: paguito_telcel
- Usuario: paguito

#### 12. HEALTH CHECK EXTERNO

**Problema:** El health check existe (`/health`, `/health/detailed`) pero no hay monitoreo externo configurado.

**Se necesita:**
- Configurar monitoreo externo (Uptime Robot, Better Stack, etc.)

#### 12. NO HAY TESTS DE INTEGRACION/E2E

**Problema:** Los 12 tests son unitarios con mocks. No hay tests de integración que prueben los endpoints reales contra la DB.

**Se necesita:**
- Tests de integración para endpoints críticos (reservations, auth)
- DB de test separada

#### 13. ✅ ESTADOS DE RESERVA - RESUELTO

**Problema:** Inconsistencia entre Prisma y código.

**Estado actual (02/04/2026):** ✅ **RESUELTO**
- El enum `EstadoReserva` en Prisma incluye: `NUEVA`, `ASIGNADA`, `EN_VISITA`, `PARCIAL`, `COMPLETADA`, `CANCELADA`, `SIN_STOCK`
- El código usa exactamente estos estados (verificado en `reservation.repository.ts`, `dashboard.service.ts`)
- **NO se encuentran** `VENDIDA` ni `NO_CONCRETADA` en el código fuente
- Los estados están unificados y son consistentes

#### 14. ✅ PANEL DE NOTIFICACIONES EN EL ADMIN - RESUELTO

**Problema:** El modelo `Notification` existía y se llenaba con cada envío, pero no había una página en el admin para ver el historial de notificaciones enviadas (éxitos/fallos).

**Resolución (02/04/2026):**
- ✅ Se actualizaron los campos del modelo Prisma: `destinatario`, `destinatarioNombre`, `asunto`
- ✅ Se creó endpoint `/api/admin/notifications` con filtros por fecha, canal, estado y búsqueda
- ✅ Se creó endpoint `/api/admin/notifications/stats` para estadísticas
- ✅ Se integró como pestaña en la página "Sistema" junto con los logs
- ✅ Se incluyen filtros por fecha, canal (EMAIL/WHATSAPP/INTERNAL), estado (SENT/FAILED/PENDING)
- ✅ Se incluye modal de detalles con información completa de cada notificación
- ✅ Se incluyen estadísticas (total, enviadas hoy, fallidas hoy, pendientes)

**Funcionalidades:**
- Ver todas las notificaciones con filtros
- Ver detalles de cada notificación (destinatario, mensaje, error, reserva asociada)
- Filtrar por canal (email, whatsapp, interna)
- Filtrar por estado (enviada, fallida, pendiente)
- Buscar por cliente, email, teléfono
- Ver estadísticas en tiempo real

---

### NUEVOS PENDIENTES DETECTADOS (02/04/2026)

#### 15. ASIGNACIÓN POR CERCANÍA GEOGRÁFICA - PENDIENTE

**Problema:** El método `getNearestVendor` en `roundrobin.service.ts` es un placeholder que cae a Round Robin.

**Código actual:**
```typescript
static async getNearestVendor(_latitude: number, _longitude: number): Promise<string> {
  // TODO: Implementar cuando se active Google Maps API avanzada
  logger.warn('getNearestVendor: No implementado aún, usando Round Robin');
  return this.getNextVendor();
}
```

**Se necesita:**
- Implementar cálculo de distancia haversine
- Obtener ubicaciones de vendedores activos
- Retornar el vendedor más cercano

#### 16. WEBHOOK PARA MENSAJES ENTRANTES DE WHATSAPP - PENDIENTE

**Problema:** No hay webhook configurado para recibir mensajes entrantes de WhatsApp. El chat es solo saliente (el cliente inicia la conversación).

**Estado actual:** En `docker-compose.yml` las variables de webhook están comentadas:
```yaml
# WEBHOOK_GLOBAL_URL: http://backend:3000/api/webhook/whatsapp
# WEBHOOK_GLOBAL_ENABLED: "true"
```

**Se necesita:**
- Crear endpoint `/api/webhook/whatsapp`
- Procesar mensajes entrantes
- Integrar con el chat IA para respuestas automáticas

#### 17. DOCUMENTACIÓN DE API (SWAGGER/OPENAPI) - PENDIENTE

**Problema:** No hay documentación de la API. Los desarrolladores deben leer el código para entender los endpoints.

**Se necesita:**
- Agregar Swagger/OpenAPI
- Documentar todos los endpoints con schemas de request/response
- Generar documentación interactiva

#### 18. SISTEMA DE AUDITORÍA COMPLETO - PENDIENTE

**Problema:** Solo hay auditoría básica para notificaciones. No hay registro de quién hizo qué acción en el sistema.

**Se necesita:**
- Tabla de auditoría para registrar acciones (login, creación, edición, eliminación)
- Middleware de auditoría que capture automáticamente las acciones
- Página de admin para consultar logs de auditoría

#### 19. BACKUP/RESTORE DE BASE DE DATOS - PENDIENTE

**Problema:** No hay mecanismo de backup automático de la base de datos.

**Se necesita:**
- Script de backup automático (cron job)
- Documentación de procedimiento de restore
- Almacenamiento de backups fuera del servidor

#### 20. INVALIDACIÓN DE CACHÉ PARA RESERVAS Y CLIENTES - PENDIENTE

**Problema:** La invalidación de caché solo está implementada para productos. Las reservas y clientes no tienen caché, pero si se agrega caché en el futuro, se debe considerar la invalidación.

**Estado actual:** `CacheService.deletePattern` está disponible y se usa para productos:
```typescript
await CacheService.deletePattern('*', { prefix: 'products' });
```

**Se necesita (si se agrega caché):**
- Invalidación de caché para reservas cuando cambian de estado
- Invalidación de caché para clientes cuando se actualizan

#### 21. ARCHIVO OBSOLETO EN FRONTEND - PENDIENTE

**Problema:** Existe `frontend/src/pages/public/ReservationForm.tsx.deprecated` que está obsoleto.

**Se necesita:**
- Eliminar el archivo obsoleto
- Verificar que no hay referencias a él en el código

---

## Tabla Resumen (actualizada 02/04/2026)

| # | Prioridad | Item | Impacto | Estado |
|---|-----------|------|---------|--------|
| 1 | CRITICO | Dockerfiles | No se puede deployar | ✅ RESUELTO |
| 2 | CRITICO | .env frontend | Frontend no conecta al backend | ✅ RESUELTO |
| 3 | CRITICO | Proxy Vite | Desarrollo no funciona correctamente | ✅ RESUELTO (ya existía) |
| 4 | CRITICO | CORS producción | Frontend no puede comunicarse con API | ✅ RESUELTO (Nginx proxy) |
| 5 | ALTA | Redis password | Seguridad comprometida | ✅ RESUELTO (contraseña configurada) |
| 6 | ALTA | Rate limiter Redis | Rate limiting se pierde al restartar | ✅ RESUELTO (Redis configurado) |
| 7 | ALTA | Postgres credenciales | Seguridad comprometida | ✅ RESUELTO (variables .env) |
| 8 | ALTA | Uploads persistencia | Imágenes se pierden al recrear container | ✅ RESUELTO (volumen persistente) |
| 9 | MEDIA | Deploy script | Deploy manual y propenso a errores | ✅ RESUELTO (deploy.sh) |
| 10 | MEDIA | Logging producción | No se pueden auditar problemas | ✅ RESUELTO (rotación + dashboard) |
| 11 | MEDIA | Health check externo | No se detectan caídas | ⏳ PENDIENTE |
| 12 | MEDIA | Tests integración | Bugs no detectados en producción | ⏳ PENDIENTE |
| 13 | MEDIA | Estados reserva | Confusión en lógica de negocio | ✅ RESUELTO (estados unificados) |
| 14 | MEDIA | Panel notificaciones | No se puede auditar envíos | ✅ RESUELTO (integrado en Sistema) |
| 15 | MEDIA | Asignación por cercanía | Vendedor no optimizado | ⏳ PENDIENTE (TODO en código) |
| 16 | MEDIA | Webhook WhatsApp | Chat solo saliente | ⏳ PENDIENTE |
| 17 | BAJA | Documentación API | Desarrollo lento sin docs | ⏳ PENDIENTE |
| 18 | BAJA | Sistema auditoría | No hay trazabilidad de acciones | ⏳ PENDIENTE |
| 19 | BAJA | Backup automático | Riesgo de pérdida de datos | ⏳ PENDIENTE |
| 20 | BAJA | Invalidación caché | Caché puede quedar desactualizada | ⏳ PENDIENTE (solo productos) |
| 21 | BAJA | Archivo obsoleto | Código muerto | ⏳ PENDIENTE |

---

## Resumen Ejecutivo

### ✅ RESUELTOS (verificados en código)
1. Dockerfiles y docker-compose completo
2. Configuración de frontend para producción
3. Proxy de Vite configurado
4. CORS resuelto con Nginx proxy
5. Rate limiter con soporte Redis (falta activar)
6. Credenciales de Postgres en variables de entorno
7. Volumen persistente para uploads
8. Deploy script automatizado
9. Estados de reserva unificados (Prisma = Código)
10. **Redis con contraseña** - Seguridad implementada
11. **Logging con rotación + Dashboard** - Rotación diaria, compresión, retención 30 días, dashboard en admin
12. **Panel de notificaciones** - Historial de emails/whatsapp con filtros, integrado en página Sistema

### ⚠️ PENDIENTES CRÍTICOS/ALTOS
*No hay pendientes críticos/altos*

### ⏳ PENDIENTES MEDIOS
1. Health check externo
2. Tests de integración
3. Asignación por cercanía geográfica
4. Webhook para WhatsApp entrante

### ⏳ PENDIENTES BAJOS
1. Documentación de API
2. Sistema de auditoría
3. Backup automático
4. Invalidación de caché (parcial)
5. Limpieza de archivo obsoleto

---

## Archivos Docker creados (31/03/2026)

| Archivo | Descripción |
|---------|-------------|
| `backend/Dockerfile` | Multi-stage build: deps → prisma → build → production (Node.js 20 Alpine) |
| `backend/.dockerignore` | Excluye node_modules, .env, tests, dist de la imagen |
| `frontend/Dockerfile` | Multi-stage build: node → nginx (sirve archivos estáticos compilados) |
| `frontend/.dockerignore` | Excluye node_modules, .env de la imagen |
| `frontend/nginx.conf` | Nginx: sirve SPA + proxy /api al backend + soporte SSE para chat IA |
| `docker-compose.yml` | 6 servicios: postgres, redis, evolution-postgres, evolution-api, backend, frontend |
| `.env.docker` | Variables de entorno de ejemplo (copiar como .env y completar) |
| `deploy.sh` | Script de deploy: git pull → build → migrate → up -d + verifica WhatsApp |
| `evolution-init.sh` | Auto-crea instancia de WhatsApp al arrancar (sin intervención manual) |
| `GUIA-ORACLE-CLOUD.md` | Guía paso a paso para deployar en Oracle Cloud Always Free |

**Para deployar:**
```bash
# En tu PC (primera vez para probar localmente)
cp .env.docker .env
# Editar .env con tus valores
docker compose build
docker compose up -d

# En Oracle Cloud (producción)
# Seguir la guía en GUIA-ORACLE-CLOUD.md
```
