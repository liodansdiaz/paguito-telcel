# Amigo Paguitos Telcel

Sistema web para la gestión de ventas a crédito y contado de equipos celulares Telcel. Permite a los clientes explorar el catálogo, realizar reservas en línea y recibir la visita de un vendedor a domicilio. Los administradores gestionan el inventario, las reservas y los vendedores desde un panel centralizado.

---

## Tabla de Contenidos

- [🔐 Seguridad y Configuración](#-seguridad-y-configuración-importante)
- [Características principales](#características-principales)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura de la base de datos](#estructura-de-la-base-de-datos)
- [API — Endpoints](#api--endpoints)
- [Roles y permisos](#roles-y-permisos)
- [Credenciales de prueba](#credenciales-de-prueba)

---

## 🔐 Seguridad y Configuración (IMPORTANTE)

> ⚠️ **Antes de comenzar, lee esto:**

Esta aplicación requiere configuración segura de variables de entorno, especialmente para JWT y Redis.

**📖 Guía de Configuración Rápida:** [SEGURIDAD-SETUP.md](./SEGURIDAD-SETUP.md)

**🛡️ Guía Completa de Seguridad:** [backend/SECURITY.md](./backend/SECURITY.md)

### Inicio Rápido

```bash
# 1. Configurar backend
cd backend
cp .env.example .env

# 2. Generar secrets seguros
npm run generate-secrets

# 3. Copiar secrets al archivo .env (desde .env.secrets)

# 4. Validar configuración
npm run env:validate

# 5. Si todo OK, continuar con instalación normal
```

**⚠️ NUNCA uses valores de ejemplo en producción. Genera secrets únicos con `npm run generate-secrets`**

---

## Características principales

- **Catálogo público** con filtros por marca, búsqueda de texto y detalle de producto con galería de imágenes (hasta 3 por producto).
- **Formulario de reserva público** con captura de ubicación GPS, validación de horarios hábiles (L-V 9:30–16:30, Sáb 9:30–14:30) y verificación de CURP sin reserva activa.
- **Asignación automática de vendedores** mediante algoritmo Round Robin (el vendedor con más tiempo sin asignación recibe la siguiente reserva).
- **Notificaciones por email** al crear una reserva (vía Nodemailer/Gmail). Canal de WhatsApp preparado para integración futura con Twilio.
- **Panel de administración** con KPIs en tiempo real, gráficas de reservas, gestión de inventario, clientes y vendedores.
- **Panel de vendedor** con mapa interactivo (Leaflet/OpenStreetMap) que muestra las visitas asignadas con coordenadas GPS y enlace directo a Google Maps.
- **Autenticación JWT** con tokens de acceso (15 min) y refresh (7 días).
- **Upload de imágenes** de productos desde el panel admin (JPG, PNG, WebP — máx. 3 imágenes, 5 MB cada una).

---

## Stack tecnológico

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js + TypeScript | TS 5.9 | Runtime y lenguaje |
| Express | 5.2 | Framework HTTP |
| Prisma ORM | 7.4 | ORM y migraciones |
| PostgreSQL | 16 | Base de datos (via Docker) |
| JSON Web Tokens | 9.0 | Autenticación access + refresh |
| bcryptjs | 3.0 | Hash de contraseñas |
| Nodemailer | 8.0 | Envío de correos SMTP/Gmail |
| Multer | 2.1 | Subida de imágenes |
| Zod | 4.3 | Validación de esquemas |
| Helmet | 8.1 | Cabeceras HTTP de seguridad |
| express-rate-limit | 8.2 | Rate limiting por endpoint |
| Winston + Morgan | — | Logging de aplicación y HTTP |

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.2 | UI Framework |
| TypeScript | 5.9 | Tipado estático |
| Vite | 7.3 | Bundler y dev server |
| Tailwind CSS | 4.2 | Estilos utilitarios |
| React Router DOM | 7.13 | Enrutamiento SPA |
| Zustand | 5.0 | Estado global (autenticación) |
| Axios | 1.13 | Cliente HTTP |
| React Hook Form + Zod | 7.71 / 4.3 | Formularios con validación |
| Recharts | 3.7 | Gráficas (línea, barra, pie) |
| Leaflet + React Leaflet | 1.9 / 5.0 | Mapas interactivos |

### Infraestructura

- **Docker Compose**: PostgreSQL 16 en contenedor (puerto 5433 en el host).
- **Almacenamiento de imágenes**: archivos locales en `backend/uploads/productos/`.
- **Logs**: archivos en `backend/logs/` generados por Winston.

---

## Arquitectura del proyecto

```
paguito-telcel/
├── docker-compose.yml          # PostgreSQL en Docker
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos de base de datos
│   │   ├── seed.ts             # Datos iniciales (admin, vendedores, productos)
│   │   └── migrations/         # Historial de migraciones
│   ├── src/
│   │   ├── app.ts              # Entry point del servidor
│   │   ├── config/             # DB, JWT, rate limiting, notificaciones
│   │   ├── modules/            # Módulos de negocio
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── reservations/
│   │   │   ├── customers/
│   │   │   ├── users/
│   │   │   └── dashboard/
│   │   └── shared/
│   │       ├── middleware/     # Auth, errores, upload
│   │       ├── services/       # Round Robin, notificaciones, email, horarios
│   │       └── utils/          # Logger, response helpers
│   └── uploads/                # Imágenes de productos (no versionado en git)
└── frontend/
    └── src/
        ├── pages/
        │   ├── public/         # Home, Catalog, ProductDetail, ReservationForm
        │   ├── admin/          # Dashboard, Reservas, Clientes, Vendedores, Inventario
        │   └── vendor/         # Dashboard del vendedor con mapa
        ├── components/         # Layouts y componentes UI reutilizables
        ├── services/           # Cliente Axios con interceptores JWT
        ├── store/              # Zustand — estado de autenticación
        └── types/              # Interfaces TypeScript globales
```

Cada módulo del backend sigue la estructura `controller → service → repository`, lo que separa la lógica HTTP, de negocio y de acceso a datos.

---

## Requisitos previos

- [Node.js](https://nodejs.org) 18 o superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- npm (incluido con Node.js)

---

## Instalación y puesta en marcha

### 1. Levantar la base de datos

```bash
docker-compose up -d
```

Inicia un contenedor PostgreSQL 16 en el puerto `5433`. Los datos persisten en el volumen `paguito_pgdata`.

### 2. Configurar el backend

```bash
cd backend

# Copiar el archivo de variables de entorno
cp .env.example .env
# Editar .env con los valores correctos (ver sección Variables de entorno)

# Instalar dependencias
npm install

# Generar el cliente de Prisma
npm run db:generate

# Aplicar las migraciones a la base de datos
npm run db:migrate

# Cargar datos iniciales (1 admin + 5 vendedores + 8 productos de ejemplo)
npm run db:seed

# Iniciar el servidor en modo desarrollo (http://localhost:3000)
npm run dev
```

### 3. Configurar el frontend

En una nueva terminal:

```bash
cd frontend

npm install

# Iniciar el servidor de desarrollo (http://localhost:5173)
npm run dev
```

### 4. Abrir la aplicación

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:5173 |
| API backend | http://localhost:3000 |
| Health check | http://localhost:3000/health |
| Prisma Studio (opcional) | `npm run db:studio` en `/backend` |

---

## Variables de entorno

El archivo `.env.example` en la carpeta `backend/` contiene todas las variables necesarias. Copiar como `.env` y completar los valores:

```env
# Base de datos
DATABASE_URL="postgresql://paguito:paguito123@localhost:5433/paguito_telcel"

# JWT — cambiar en producción por valores aleatorios largos
JWT_SECRET="reemplazar_con_valor_secreto"
JWT_REFRESH_SECRET="reemplazar_con_valor_secreto"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Email (Nodemailer + Gmail)
# Requiere una "Contraseña de aplicación" de Google (no la contraseña normal)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="correo@gmail.com"
SMTP_PASS="contraseña_de_aplicacion_gmail"
EMAIL_FROM="Paguito Telcel <correo@gmail.com>"

# Canales de notificación (true/false)
NOTIFICATIONS_EMAIL=false
NOTIFICATIONS_WHATSAPP=false
NOTIFICATIONS_INTERNAL=true
```

> **Nota:** Para habilitar el envío de emails con Gmail es necesario activar la verificación en dos pasos y generar una *Contraseña de aplicación* en la configuración de seguridad de la cuenta de Google.

---

## Scripts disponibles

### Backend

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor con hot-reload (ts-node-dev) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Inicia el servidor desde el compilado (producción) |
| `npm run db:generate` | Genera el cliente de Prisma desde el schema |
| `npm run db:migrate` | Crea y aplica las migraciones pendientes |
| `npm run db:push` | Sincroniza el schema sin crear migración |
| `npm run db:seed` | Pobla la base de datos con datos de prueba |
| `npm run db:studio` | Abre Prisma Studio en el navegador |

### Frontend

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo (Vite) |
| `npm run build` | Compila para producción (TypeScript + Vite) |
| `npm run preview` | Preview del build de producción |
| `npm run lint` | Ejecuta ESLint |

---

## Estructura de la base de datos

### Modelos principales

**`users`** — Administradores y vendedores del sistema.

**`products`** — Catálogo de equipos celulares con soporte de hasta 3 imágenes por producto, precio de contado, precio a crédito semanal, badge y especificaciones técnicas en JSON libre.

**`customers`** — Clientes que realizan reservas. Identificados de forma única por CURP.

**`reservations`** — Reservas de compra. Incluye coordenadas GPS del domicilio del cliente, tipo de pago (contado/crédito), estado del proceso y vendedor asignado.

**`notifications`** — Registro de notificaciones enviadas por reserva (email, WhatsApp, interno) con estado de envío y log de errores.

**`round_robin_state`** — Registro singleton que mantiene el estado del algoritmo de asignación automática de vendedores.

### Estados de una reserva

```
NUEVA → ASIGNADA → EN_VISITA → VENDIDA
                             → NO_CONCRETADA
         → CANCELADA
         → SIN_STOCK
```

---

## API — Endpoints

Todos los endpoints tienen el prefijo `/api`.

### Autenticación (`/api/auth`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público | Inicio de sesión. Retorna `accessToken` y `refreshToken` |
| POST | `/auth/refresh` | Público | Renueva el `accessToken` con un `refreshToken` válido |
| GET | `/auth/me` | JWT | Retorna el perfil del usuario autenticado |

### Productos (`/api/products`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/products` | Público | Lista productos activos (filtros: `marca`, `search`, `page`, `limit`) |
| GET | `/products/marcas` | Público | Lista de marcas disponibles |
| GET | `/products/:id` | Público | Detalle de un producto |
| GET | `/products/admin/list` | ADMIN | Lista todos los productos incluyendo inactivos |
| POST | `/products/admin` | ADMIN | Crea un producto (`multipart/form-data` con hasta 3 imágenes) |
| PUT | `/products/admin/:id` | ADMIN | Actualiza un producto |
| PATCH | `/products/admin/:id/toggle` | ADMIN | Activa o desactiva un producto |

### Reservas (`/api/reservations`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/reservations` | Público | Crea una nueva reserva (asigna vendedor automáticamente) |
| GET | `/reservations/admin` | ADMIN | Lista todas las reservas con filtros y paginación |
| GET | `/reservations/admin/:id` | ADMIN | Detalle de una reserva |
| PATCH | `/reservations/admin/:id/status` | ADMIN | Cambia el estado de una reserva |
| PATCH | `/reservations/admin/:id/assign` | ADMIN | Reasigna una reserva a un vendedor |
| GET | `/reservations/vendor/my` | VENDEDOR | Lista las reservas del vendedor autenticado |
| PATCH | `/reservations/vendor/:id/status` | VENDEDOR | Actualiza el estado de una reserva propia |
| GET | `/reservations/vendor/map` | VENDEDOR | Reservas activas con coordenadas GPS para el mapa |

### Clientes (`/api/admin/customers`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/admin/customers` | ADMIN | Directorio paginado de clientes |
| GET | `/admin/customers/:id` | ADMIN | Perfil del cliente con historial de reservas |
| PATCH | `/admin/customers/:id/status` | ADMIN | Cambia el estado del cliente (`ACTIVO` / `BLOQUEADO`) |

### Usuarios/Vendedores (`/api/admin/users`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/admin/users` | ADMIN | Lista de usuarios |
| GET | `/admin/users/:id` | ADMIN | Detalle de un usuario |
| POST | `/admin/users` | ADMIN | Crea un nuevo vendedor |
| PUT | `/admin/users/:id` | ADMIN | Actualiza datos del usuario |
| PATCH | `/admin/users/:id/toggle` | ADMIN | Activa o desactiva un usuario |

### Dashboard (`/api/dashboard`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/dashboard/admin/metrics` | ADMIN | KPIs generales del negocio |
| GET | `/dashboard/admin/chart` | ADMIN | Reservas por día (últimos 7 días) |
| GET | `/dashboard/admin/status-distribution` | ADMIN | Distribución de reservas por estado |
| GET | `/dashboard/admin/vendor-ranking` | ADMIN | Ranking de vendedores por ventas |
| GET | `/dashboard/vendor` | VENDEDOR | Métricas personales del vendedor |

---

## Roles y permisos

| Rol | Descripción | Accesos |
|---|---|---|
| `ADMIN` | Administrador del sistema | Panel completo: dashboard con KPIs y gráficas, gestión de reservas, inventario, clientes y vendedores |
| `VENDEDOR` | Agente de ventas a domicilio | Dashboard personal, mapa con visitas asignadas, actualización de estado de sus reservas |

Los clientes que realizan reservas son usuarios **anónimos** — no requieren cuenta ni registro previo.

---

## Credenciales de prueba

Generadas por `npm run db:seed`:

| Rol | Email | Contraseña |
|---|---|---|
| ADMIN | `admin@paguito.com` | `Admin123!` |
| VENDEDOR | `roberto@paguito.com` | `Vend123!` |
| VENDEDOR | `maria@paguito.com` | `Vend123!` |
| VENDEDOR | `carlos@paguito.com` | `Vend123!` |
| VENDEDOR | `ana@paguito.com` | `Vend123!` |
| VENDEDOR | `jorge@paguito.com` | `Vend123!` |

> **Importante:** Cambiar todas las contraseñas y los valores secretos del `.env` antes de cualquier despliegue en producción.
