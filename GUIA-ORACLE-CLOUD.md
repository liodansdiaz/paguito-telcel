# Guía Completa: Deploy en Oracle Cloud (Gratis para siempre)

> **Contexto:** Esta guía fue creada el 31 de marzo de 2026 como resultado de un análisis
> completo del proyecto Paguito Telcel para preparar el deploy a producción. Se evaluaron
> múltiples opciones de hosting gratuito (Render, Railway, Fly.io, Koyeb, Google Cloud Run)
> y se decidió usar Oracle Cloud Always Free por ser la única opción que permite correr
> docker-compose completo (frontend + backend + postgres + redis + evolution-api) sin costo.

---

## Arquitectura del deploy

```
Internet
   │
   │  Puerto 80              Puerto 8080
   │     │                      │
   ▼     ▼                      ▼
┌──────────────┐         ┌──────────────┐
│  FRONTEND    │         │ EVOLUTION    │
│  (Nginx)     │         │ API          │
└──────┬───────┘         └──────┬───────┘
       │ /api                   │
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│  BACKEND     │────────▶│ EVOLUTION    │
│  (Express)   │         │ POSTGRES     │
└──────┬───────┘         └──────────────┘
       │
       ▼
┌──────────────┐         ┌──────────────┐
│  POSTGRES    │         │    REDIS     │
│  (Paguito)   │         │   (Cache)    │
└──────────────┘         └──────────────┘

Todo corriendo en UNA VM de Oracle Cloud (ARM Ampere A1)
Costo: $0/mes (gratis para siempre)
```

---

## Archivos Docker creados para este deploy

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| `backend/Dockerfile` | `backend/Dockerfile` | Multi-stage build: deps → prisma → build → production |
| `frontend/Dockerfile` | `frontend/Dockerfile` | Multi-stage build: node → nginx (sirve archivos estáticos) |
| `frontend/nginx.conf` | `frontend/nginx.conf` | Nginx config: sirve frontend + proxy /api al backend + soporte SSE |
| `backend/.dockerignore` | `backend/.dockerignore` | Excluye node_modules, .env, tests de la imagen |
| `frontend/.dockerignore` | `frontend/.dockerignore` | Excluye node_modules, .env de la imagen |
| `.env.docker` | raíz `.env.docker` | Variables de entorno de ejemplo para Docker Compose |
| `deploy.sh` | raíz `deploy.sh` | Script de deploy: git pull → build → migrate → up -d |
| `evolution-init.sh` | raíz `evolution-init.sh` | Auto-crea instancia de WhatsApp al arrancar (sin intervención manual) |
| `docker-compose.yml` | raíz `docker-compose.yml` | Orquesta los 6 servicios: postgres, redis, evolution-postgres, evolution-api, backend, frontend |

---

## Decisiones tomadas

### ¿Por qué Oracle Cloud y no Render/Railway/Fly.io?

| Opción | Problema |
|--------|----------|
| **Render** | Docker Compose no soportado, se duerme a los 15 min, necesita tarjeta |
| **Railway** | $5/mes (no es gratis), bueno pero queríamos $0 |
| **Fly.io** | Ya no tiene tier gratis para nuevos usuarios |
| **Koyeb** | Solo 1 servicio gratis, no alcanza para 4+ contenedores |
| **Google Cloud Run** | No soporta docker-compose, cada servicio por separado |
| **Oracle Cloud** | VM completa con 4 CPU + 24 GB RAM, docker-compose funciona, $0 forever |

### ¿Por qué docker-compose en lugar de servicios separados?

Porque docker-compose permite:
1. Un solo comando para levantar todo (`docker compose up -d`)
2. Las variables de entorno se comparten automáticamente entre servicios
3. Los nombres de servicio se resuelven internamente (ej: `postgres`, `redis`, `evolution-api`)
4. Los volúmenes persisten datos entre reinicios
5. Las dependencias entre servicios se manejan con `depends_on`

### ¿Por qué Evolution API tiene su propio Postgres?

Porque Evolution API maneja su propio esquema de tablas (mensajes, contactos, chats)
que es completamente diferente al esquema de Paguito Telcel. Separarlos evita conflictos
y permite hacer backup/restore de cada base independientemente.

### ¿Cómo funciona el auto-setup de WhatsApp?

El servicio `evolution-init`:
1. Espera a que `evolution-api` esté listo
2. Verifica si la instancia "paguito" ya existe
3. Si no existe, la crea automáticamente via API
4. Si ya existe, no hace nada

**Lo ÚNICO manual es escanear el QR la primera vez.** La sesión se guarda en el
volumen `evolution_instances` y persiste entre reinicios del contenedor.

### ¿Qué pasa si se pierde la sesión de WhatsApp?

La sesión se pierde SOLO si:
- Usás `docker compose down -v` (esto borra los volúmenes)
- WhatsApp te desconecta por inactividad de meses
- Tu celular se queda sin batería por mucho tiempo

Para reconectar: andá a `http://TU_IP:8080/instance/connect/paguito` y escaneá el QR de nuevo.

---

## Variables de entorno importantes

Ver archivo `.env.docker` para la lista completa. Las más críticas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `JWT_SECRET` | Clave para tokens JWT | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Clave para refresh tokens | `openssl rand -base64 64` |
| `DB_PASSWORD` | Contraseña de Postgres (Paguito) | `TuPasswordSeguro123!` |
| `FRONTEND_URL` | URL pública del frontend | `http://129.146.45.123` |
| `NOTIFICATIONS_WHATSAPP` | Activar WhatsApp | `true` |
| `EVOLUTION_API_KEY` | API key de Evolution | `paguito-whatsapp-2026-secreto` |
| `EVOLUTION_SERVER_URL` | URL pública de Evolution | `http://129.146.45.123:8080` |

---

## Puertos que se necesitan abrir en el firewall de Oracle

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| 22 | SSH | Para conectarse al servidor |
| 80 | Frontend (Nginx) | Para que los usuarios vean la web |
| 3000 | Backend (Express) | Para la API (opcional si usás Nginx proxy) |
| 8080 | Evolution API | Para WhatsApp y su Swagger UI |

---

## Tabla de Contenidos

1. [Lo que necesitás antes de empezar](#lo-que-necesitás-antes-de-empezar)
2. [Paso 1: Crear cuenta en Oracle Cloud](#paso-1-crear-cuenta-en-oracle-cloud)
3. [Paso 2: Crear una VM (servidor virtual)](#paso-2-crear-una-vm-servidor-virtual)
4. [Paso 3: Configurar el firewall de Oracle](#paso-3-configurar-el-firewall-de-oracle)
5. [Paso 4: Conectarse al servidor por SSH](#paso-4-conectarse-al-servidor-por-ssh)
6. [Paso 5: Instalar Docker en el servidor](#paso-5-instalar-docker-en-el-servidor)
7. [Paso 6: Copiar tu proyecto al servidor](#paso-6-copiar-tu-proyecto-al-servidor)
8. [Paso 7: Configurar las variables de entorno](#paso-7-configurar-las-variables-de-entorno)
9. [Paso 8: Levantar la aplicación](#paso-8-levantar-la-aplicación)
10. [Paso 9: Verificar que todo funciona](#paso-9-verificar-que-todo-funciona)
11. [Paso 10: Configurar WhatsApp (Evolution API)](#paso-10-configurar-whatsapp-evolution-api)
12. [Comandos útiles para el día a día](#comandos-útiles-para-el-día-a-día)
13. [Solución de problemas comunes](#solución-de-problemas-comunes)

---

## Lo que necesitás antes de empezar

- **Tarjeta de crédito o débito** (no te van a cobrar, es solo para verificar identidad)
- **Un navegador web** (Chrome, Firefox, Edge)
- **Git instalado** en tu PC (para clonar tu repo)
- **Tu proyecto subido a GitHub** (el repo de Paguito Telcel)

---

## Paso 1: Crear cuenta en Oracle Cloud

### 1.1 Ir al sitio de Oracle Cloud

Abre tu navegador y andá a:
```
https://www.oracle.com/cloud/free/
```

### 1.2 Hacé click en "Start for free"

Vas a ver un botón grande que dice "Start for free" o "Comenzar gratis". Hacé click ahí.

### 1.3 Completar el formulario de registro

Te va a pedir:

1. **País:** Seleccioná México (o tu país)
2. **Nombre completo:** Tu nombre real
3. **Email:** Un email que uses frecuentemente
4. **Verificación por email:** Oracle te envía un código. Andá a tu email, copiá el código y pegalo.

### 1.4 Información de contacto

Completá con tus datos reales:
- Nombre
- Dirección
- Código postal
- Teléfono

### 1.5 Método de pago (tarjeta)

**IMPORTANTE:** Oracle te pide una tarjeta para verificar que sos una persona real.

- Ingresá los datos de tu tarjeta de crédito o débito
- Oracle hace una retención de $1 USD (como "prueba") que se libera en unos días
- **NO te van a cobrar nada** mientras uses los recursos "Always Free"
- Si algún recurso empieza a cobrarte, Oracle te avisa antes

### 1.6 Elegir tipo de cuenta

Elegí **"Free Tier"** (nivel gratuito). NO elegás "Pay As You Go" a menos que quieras pagar.

### 1.7 Verificación final

Oracle puede pedirte verificar tu identidad por SMS o llamada telefónica. Seguí las instrucciones.

### 1.8 Esperar la activación

Después del registro, Oracle tarda entre **5 minutos y 24 horas** en activar tu cuenta. Te llega un email cuando esté lista.

**Cuando recibas el email de confirmación, seguí al Paso 2.**

---

## Paso 2: Crear una VM (servidor virtual)

Una VM (Virtual Machine) es un "servidor" que vive en la nube de Oracle. Es como tener una computadora encendida 24/7 en internet, pero gratis.

### 2.1 Iniciar sesión en Oracle Cloud

1. Andá a https://cloud.oracle.com
2. Hacé click en "Sign In"
3. Ingresá tu email y contraseña
4. Elegí tu "Cloud Account" (te aparece uno solo si es tu primera vez)
5. Hacé click en "Sign In" de nuevo

### 2.2 Ir a "Instances" (Instancias)

En el menú de la izquierda (o en el menú de hamburguesa ☰ si estás en móvil):

1. Hacé click en el menú ☰ (las tres rayitas arriba a la izquierda)
2. Buscá **"Compute"**
3. Hacé click en **"Instances"**

Vas a ver una página que dice "Create Instance" o "Crear instancia".

### 2.3 Crear la instancia

Hacé click en **"Create Instance"** (Crear instancia) o **"Create compute instance"**.

#### Nombre de la instancia
Escribí: `paguito-telcel-server`
(El nombre que quieras, pero este es descriptivo)

#### Placement (Ubicación)
- Dejá la opción por defecto o elegí una zona
- Si querés, podés cambiar el "Availability Domain" (dominio de disponibilidad)
- No importa mucho cuál elijas

#### Imagen y forma (Shape) - ESTO ES LO IMPORTANTE

1. Buscá la sección **"Image and shape"**
2. Hacé click en **"Change image"** o **"Change shape"**

**Para la forma (Shape):**
1. Elegí **"Ampere"** (ARM)
2. Si no está disponible, elegí **"AMD"** (Micro)

**Para la imagen (Image):**
1. Elegí **"Canonical Ubuntu"**
2. Seleccioná la versión más reciente: **Ubuntu 24.04** o **Ubuntu 22.04**

#### CPUs y memoria

**Si elegiste Ampere (ARM) - RECOMENDADO:**
- Deslizá el slider para usar **4 OCPUs** y **24 GB RAM**
- Esto usa todo tu límite gratuito de ARM
- Es MUCHO poder para una app como Paguito Telcel

**Si elegiste AMD (Micro):**
- No podés cambiar los recursos (es fijo: 1/8 OCPU, 1 GB RAM)
- Sirve para pruebas pero es muy limitado

#### Clave SSH - MUY IMPORTANTE

SSH es la forma de conectarte a tu servidor desde tu PC. Necesitás una "llave" (como una contraseña digital).

1. Buscá la sección **"Add SSH keys"**
2. Elegí **"Generate a key pair for me"** (Generar par de claves para mí)
3. Oracle te va a generar dos archivos:
   - **`ssh-key-YYYY-MM-DD.key`** (tu llave PRIVADA - NO la compartas con nadie)
   - **`ssh-key-YYYY-MM-DD.key.pub`** (tu llave PÚBLICA - esta sí se sube al servidor)

4. **IMPORTANTE:** Hacé click en **"Save Private Key"** y **"Save Public Key"** para descargarlos
5. Guardalos en una carpeta segura en tu PC, por ejemplo:
   ```
   C:\Users\TuUsuario\.ssh\oracle\
   ```

**SI PERDÉS LA LLAVE PRIVADA, NO PODÉS CONECTARTE MÁS AL SERVIDOR.** Guardala bien.

#### Boot volume (Disco)

Dejá los valores por defecto:
- 47 GB de almacenamiento (gratis dentro del límite de 200 GB)

### 2.4 Hacer click en "Create"

Revisá que todo esté bien y hacé click en **"Create"** (Crear).

Oracle va a tomar entre **30 segundos y 2 minutos** en crear tu VM.

### 2.5 Copiar la IP pública

Cuando la VM esté creada, vas a ver:
- **Estado:** "Running" (Corriendo)
- **Public IP address:** algo como `129.146.XX.XX` o `140.XX.XX.XX`

**COPICÁ ESA IP.** La vas a necesitar para todo. Es la dirección de tu servidor en internet.

Ejemplo: `129.146.45.123`

---

## Paso 3: Configurar el firewall de Oracle

Oracle tiene un firewall que controla qué puertos están abiertos. Por defecto, TODO está cerrado. Tenés que abrir los puertos que necesitás.

### 3.1 Ir a los detalles de la VM

1. En la página de tu instancia, hacé click en el nombre de la VM
2. Buscá la sección **"Primary VNIC"** (o "Virtual Cloud Network")
3. Hacé click en el nombre de la **Subnet** (subred) o del **VCN**

### 3.2 Ir a "Security Lists"

1. En el menú de la izquierda, buscá **"Security Lists"** (Listas de seguridad)
2. Hacé click en la lista que dice **"Default Security List for ..."**

### 3.3 Agregar reglas de ingreso (Ingress Rules)

Hacé click en **"Add Ingress Rules"** (Agregar reglas de ingreso).

Necesitás crear **4 reglas**:

**Regla 1: Puerto 80 (HTTP - Frontend)**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 80
Description: HTTP para el frontend
```

**Regla 2: Puerto 3000 (Backend API)**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 3000
Description: Backend API
```

**Regla 3: Puerto 22 (SSH - Para conectarte)**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 22
Description: SSH para administrar el servidor
```

**Regla 4: Puerto 8080 (Evolution API - WhatsApp)**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 8080
Description: Evolution API WhatsApp
```

Para cada regla:
1. Hacé click en "Add Ingress Rules"
2. Completá los campos como arriba
3. Hacé click en "Add Ingress Rules" de nuevo para guardar

### ¿Qué es CIDR?

`0.0.0.0/0` significa "cualquier IP del mundo puede conectarse". Es como decir "dejá la puerta abierta para todos". Para producción, podrías restringirlo, pero para empezar está bien.

### ¿Qué son los puertos?

- **Puerto 22:** Para conectarte por SSH (como una terminal remota)
- **Puerto 80:** Para que la gente vea tu frontend (HTTP)
- **Puerto 3000:** Para que tu frontend se comunique con el backend (API)

---

## Paso 4: Conectarse al servidor por SSH

SSH es como abrir una "terminal" o "símbolo del sistema" pero en el servidor remoto. Es la forma de administrar tu servidor.

### 4.1 Si estás en Windows

Windows 10 y 11 ya traen SSH instalado. Abrí **PowerShell** o **Símbolo del sistema**:

1. Presioná `Windows + R`
2. Escribí `powershell`
3. Presioná Enter

### 4.2 Mover tu llave privada a la carpeta correcta

Si descargaste la llave en `C:\Users\TuUsuario\Downloads\ssh-key-2026-03-31.key`, movela a:

```
C:\Users\TuUsuario\.ssh\oracle_key
```

### 4.3 Darle permisos a la llave (solo Windows)

En PowerShell:
```powershell
# Navegá a la carpeta donde está la llave
cd C:\Users\TuUsuario\.ssh

# Quitá permisos de otros usuarios (seguridad)
icacls oracle_key /inheritance:r
icacls oracle_key /grant:r "%USERNAME%:R"
```

### 4.4 Conectarte al servidor

```powershell
ssh -i C:\Users\TuUsuario\.ssh\oracle_key ubuntu@TU_IP_PUBLICA
```

**Ejemplo con IP real:**
```powershell
ssh -i C:\Users\TuUsuario\.ssh\oracle_key ubuntu@129.146.45.123
```

**Si te pregunta "Are you sure you want to continue connecting?"**, escribí `yes` y presioná Enter.

**Si todo sale bien, vas a ver algo así:**
```
Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-1012-oracle aarch64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

Last login: ...
ubuntu@paguito-telcel-server:~$
```

**¡Felicidades! Estás dentro de tu servidor.** Todo lo que escribas ahora se ejecuta en Oracle Cloud, no en tu PC.

### 4.5 Si estás en Mac o Linux

Es lo mismo, pero los comandos de permisos son:
```bash
chmod 600 ~/.ssh/oracle_key
ssh -i ~/.ssh/oracle_key ubuntu@TU_IP_PUBLICA
```

---

## Paso 5: Instalar Docker en el servidor

Docker es lo que permite correr tu aplicación dentro de "contenedores". Necesitás instalarlo en el servidor.

### 5.1 Actualizar el sistema

Copia y pegá estos comandos UNO POR UNO en la terminal del servidor (la que abriste en el paso anterior):

```bash
sudo apt-get update
```

Esto actualiza la lista de paquetes disponibles. Tarda unos segundos.

```bash
sudo apt-get upgrade -y
```

Esto actualiza todos los paquetes del sistema. Tarda 1-3 minutos.

### 5.2 Instalar Docker

```bash
sudo apt-get install -y docker.io docker-compose-plugin
```

Esto instala Docker y Docker Compose. Tarda 1-2 minutos.

### 5.3 Configurar Docker para que no necesites "sudo"

Por defecto, Docker necesita que pongas `sudo` antes de cada comando. Esto lo arregla:

```bash
sudo usermod -aG docker ubuntu
```

### 5.4 Aplicar los cambios

```bash
newgrp docker
```

### 5.5 Verificar que Docker funciona

```bash
docker --version
```

Deberías ver algo como:
```
Docker version 24.0.7, build 24.0.7-0ubuntu4
```

```bash
docker compose version
```

Deberías ver algo como:
```
Docker Compose version v2.29.1
```

**Si ves las versiones, Docker está instalado correctamente.**

---

## Paso 6: Copiar tu proyecto al servidor

Necesitás poner tu código de Paguito Telcel en el servidor. La forma más fácil es clonarlo desde GitHub.

### 6.1 Instalar Git

```bash
sudo apt-get install -y git
```

### 6.2 Configurar Git (una sola vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### 6.3 Clonar tu repositorio

```bash
cd ~
git clone https://github.com/TU_USUARIO/paguito-telcel.git
```

**Reemplazá `TU_USUARIO` con tu usuario de GitHub.**

Si tu repo es privado, GitHub te va a pedir credenciales. Usá un **Personal Access Token** de GitHub:
1. Andá a GitHub → Settings → Developer settings → Personal access tokens
2. Generá un token con permisos de "repo"
3. Usá tu email como usuario y el token como contraseña

### 6.4 Entrar al directorio del proyecto

```bash
cd paguito-telcel
```

Verificá que estás en el lugar correcto:
```bash
ls
```

Deberías ver:
```
backend  frontend  docker-compose.yml  deploy.sh  ...
```

---

## Paso 7: Configurar las variables de entorno

Las variables de entorno son configuraciones sensibles (contraseñas, claves API) que NO se suben a GitHub.

### 7.1 Generar los secrets de JWT

En el servidor, ejecutá:

```bash
openssl rand -base64 64
```

Te va a dar algo como:
```
x8K2mN5pQ9rS3tU6vW7yA1bC4dE8fG0hI2jK5lM7nO9pQ1rS4tU6vW8xY0zA3bC5dE7fG...
```

**Copiá ese valor.** Es tu `JWT_SECRET`.

Ejecutá de nuevo para tener un segundo secret:
```bash
openssl rand -base64 64
```

**Copiá ese segundo valor.** Es tu `JWT_REFRESH_SECRET`.

### 7.2 Crear el archivo .env

```bash
nano .env
```

Esto abre un editor de texto llamado "nano". Copiá y pegá TODO el siguiente contenido:

```
# Base de datos
DB_USER=paguito
DB_PASSWORD=TU_PASSWORD_SEGURO
DB_NAME=paguito_telcel
DB_PORT=5433

# JWT (pegá los valores que generaste arriba)
JWT_SECRET=PEGÁ_AQUÍ_EL_PRIMER_SECRET
JWT_REFRESH_SECRET=PEGÁ_AQUÍ_EL_SEGUNDO_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Servidor
NODE_ENV=production
FRONTEND_URL=http://TU_IP_PUBLICA

# Redis
REDIS_ENABLED=false

# Email (dejar en false si no usás)
NOTIFICATIONS_EMAIL=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# WhatsApp (dejar en false si no usás)
NOTIFICATIONS_WHATSAPP=false
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=

# Chat IA (dejar vacío si no usás)
GROQ_API_KEY=

# Otros
DAILY_SUMMARY_HOUR=18
FRONTEND_PORT=80
```

**REEMPLAZÁ:**
- `TU_PASSWORD_SEGURO` con una contraseña fuerte para la base de datos
- `PEGÁ_AQUÍ_EL_PRIMER_SECRET` con el primer valor de openssl
- `PEGÁ_AQUÍ_EL_SEGUNDO_SECRET` con el segundo valor de openssl
- `TU_IP_PUBLICA` con la IP de tu servidor (ej: `129.146.45.123`)

### 7.3 Guardar y salir de nano

1. Presioná `Ctrl + O` para guardar
2. Presioná `Enter` para confirmar el nombre del archivo
3. Presioná `Ctrl + X` para salir del editor

### 7.4 Verificar que el archivo se creó

```bash
cat .env
```

Deberías ver el contenido del archivo que acabás de crear.

---

## Paso 8: Levantar la aplicación

Ahora viene la mejor parte: levantar toda la aplicación con un solo comando.

### 8.1 Construir las imágenes Docker

```bash
docker compose build
```

Esto va a:
- Descargar las imágenes base (Node.js, Nginx, Postgres, Redis)
- Instalar las dependencias del backend y frontend
- Compilar TypeScript
- Generar el cliente de Prisma
- Construir el frontend de React

**Tarda entre 5 y 15 minutos la primera vez.** Las siguientes veces tarda menos porque Docker cachea las capas.

Vas a ver algo como:
```
[+] Building 120.5s (25/25) FINISHED
```

### 8.2 Iniciar todos los servicios

```bash
docker compose up -d
```

El flag `-d` significa "detached" (en segundo plano). Los contenedores corren sin bloquear la terminal.

Vas a ver algo como:
```
[+] Running 5/5
 ✔ Network paguito-telcel_default    Created
 ✔ Container paguito-postgres        Started
 ✔ Container paguito-redis           Started
 ✔ Container paguito-backend         Started
 ✔ Container paguito-frontend        Started
```

### 8.3 Ejecutar las migraciones de la base de datos

La primera vez, necesitás crear las tablas en la base de datos:

```bash
docker compose exec backend npx prisma migrate deploy
```

Vas a ver algo como:
```
No pending migrations to apply.
```

O si es la primera vez:
```
Applying migration 20260101000000_init...
Applying migration 20260101000001_add_notifications...
```

### 8.4 Cargar los datos iniciales (seed)

```bash
docker compose exec backend npx prisma db seed
```

Esto crea el usuario admin y los vendedores de prueba.

---

## Paso 9: Verificar que todo funciona

### 9.1 Ver el estado de los contenedores

```bash
docker compose ps
```

Deberías ver algo como:
```
NAME                  STATUS              PORTS
paguito-postgres      Up 2 minutes        0.0.0.0:5433->5432/tcp
paguito-redis         Up 2 minutes        0.0.0.0:6379->6379/tcp
paguito-backend       Up 2 minutes        0.0.0.0:3000->3000/tcp
paguito-frontend      Up 2 minutes        0.0.0.0:80->80/tcp
```

Todos deben decir **"Up"**. Si alguno dice "Exited" o "Restarting", hay un error.

### 9.2 Probar el frontend

Abrí tu navegador y andá a:
```
http://TU_IP_PUBLICA
```

**Ejemplo:** `http://129.146.45.123`

Deberías ver la página de inicio de Paguito Telcel.

### 9.3 Probar el backend (health check)

En tu navegador, andá a:
```
http://TU_IP_PUBLICA/health
```

Deberías ver algo como:
```json
{
  "status": "ok",
  "timestamp": "2026-03-31T12:00:00.000Z",
  "service": "Paguito Telcel API"
}
```

### 9.4 Probar el login

Andá a:
```
http://TU_IP_PUBLICA/login
```

Usá las credenciales del seed:
- **Email:** admin@paguito.com
- **Password:** Admin123!

### 9.5 Ver los logs (si algo falla)

```bash
# Ver logs del backend
docker compose logs backend

# Ver logs del frontend
docker compose logs frontend

# Ver logs de todos
docker compose logs

# Ver logs en tiempo real (se actualiza automáticamente)
docker compose logs -f backend
```

---

## Paso 10: Configurar WhatsApp (Evolution API)

Evolution API es el servicio que permite enviar y recibir mensajes de WhatsApp desde tu aplicación. Funciona conectándose a WhatsApp Web como si fuera un navegador.

### ¿Cómo funciona?

```
Tu App (Backend)  →  Evolution API  →  WhatsApp
     "Enviar mensaje"     "Lo envía"      "Llega al cliente"
```

Evolution API actúa como un "puente" entre tu aplicación y WhatsApp.

### Configuración automática

**Buena noticia:** La instancia de WhatsApp se crea AUTOMÁTICAMENTE cuando levantás `docker compose up -d`. No necesitás hacer nada manualmente.

Un servicio llamado `evolution-init` espera a que Evolution API esté listo, verifica si la instancia existe, y si no, la crea solo.

### 10.1 Activar WhatsApp en las variables de entorno

Conectate a tu servidor por SSH y editá el archivo `.env`:

```bash
cd ~/paguito-telcel
nano .env
```

Buscá estas líneas y cambialas:

```
# Cambiá de false a true
NOTIFICATIONS_WHATSAPP=true

# URL pública del servidor (tu IP de Oracle Cloud)
EVOLUTION_SERVER_URL=http://TU_IP_PUBLICA:8080
```

Guardá con `Ctrl + O`, `Enter`, `Ctrl + X`.

### 10.2 Abrir el puerto 8080 en el firewall de Oracle

Necesitás abrir el puerto 8080 para poder acceder a la interfaz de Evolution API.

1. Andá a Oracle Console → Compute → Tu VM
2. Hacé click en la Subnet / VCN
3. Security Lists → Default Security List
4. Add Ingress Rules:
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 8080
Description: Evolution API
```

### 10.3 Reiniciar los servicios

```bash
docker compose down
docker compose up -d
```

Vas a ver 7 contenedores corriendo (incluyendo evolution-init que corre una sola vez):

```bash
docker compose ps
```

### 10.4 Conectar WhatsApp escaneando el QR

**Esto es lo ÚNICO que tenés que hacer manualmente.** La primera vez, necesitás escanear un QR con tu celular para vincular WhatsApp.

Abrí en tu navegador:
```
http://TU_IP_PUBLICA:8080/instance/connect/paguito
```

Te va a mostrar un QR code.

**Para conectar:**
1. Abrí WhatsApp en tu celular
2. Andá a Configuración → Dispositivos vinculados → Vincular un dispositivo
3. Escaneá el QR que aparece en la pantalla
4. Esperá a que diga "Conectado"

**Una vez que escaneás el QR, la sesión se guarda y NUNCA MÁS tenés que hacerlo** (a menos que WhatsApp te desconecte por inactividad prolongada de meses).

### 10.5 Verificar que WhatsApp está conectado

```bash
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: paguito-whatsapp-2026-secreto"
```

Deberías ver `"status": "open"` que significa que WhatsApp está conectado.

### 10.6 Probar el envío de un mensaje

```bash
curl -X POST http://localhost:8080/message/sendText/paguito \
  -H "Content-Type: application/json" \
  -H "apikey: paguito-whatsapp-2026-secreto" \
  -d '{
    "number": "521XXXXXXXXXX",
    "text": "¡Hola! Este es un mensaje de prueba de Paguito Telcel."
  }'
```

**REEMPLAZÁ `521XXXXXXXXXX` con un número real de WhatsApp.**
- Formato: 521 + 10 dígitos del número
- Ejemplo: `5215512345678` (para el número 55 1234 5678 de México)

### ¿Qué pasa si se desconecta WhatsApp?

WhatsApp puede desconectarse por:
- Tu celular se quedó sin batería
- No usaste WhatsApp en mucho tiempo
- WhatsApp detectó actividad sospechosa

**Para reconectar:**
1. Andá a `http://TU_IP_PUBLICA:8080/instance/connect/paguito`
2. Escaneá el QR de nuevo con tu celular

**Recomendación:** Usá un celular dedicado solo para esto, no tu WhatsApp personal.

### Resumen del flujo automático

```
docker compose up -d
        │
        ▼
evolution-api arranca
        │
        ▼
evolution-init espera a que esté listo
        │
        ▼
Verifica si la instancia "paguito" existe
        │
        ├── SÍ existe  → No hace nada, todo listo
        │
        └── NO existe  → La crea automáticamente
                         │
                         ▼
              Vos solo escaneás el QR UNA vez
                         │
                         ▼
              La sesión persiste para siempre
              (entre reinicios, updates, etc.)
```

### Nota sobre migración a la API oficial de WhatsApp

Evolution API usa WhatsApp Web (no oficial). Cuando quieras migrar a la API oficial de Meta:

1. Necesitás una cuenta de **Meta Business**
2. Registrar tu número en **WhatsApp Business API**
3. Cambiar la configuración del backend para usar la API oficial
4. La lógica de tu app no cambia mucho (solo la URL y autenticación)

La buena noticia es que **tu código del backend ya está preparado** para esto. El `whatsapp.service.ts` separa la lógica de envío de la implementación, así que solo tenés que cambiar el service, no los controllers ni las rutas.

---

## Comandos útiles para el día a día

### Ver estado de los servicios
```bash
docker compose ps
```

### Detener todos los servicios
```bash
docker compose down
```

### Iniciar todos los servicios
```bash
docker compose up -d
```

### Reiniciar un servicio específico
```bash
docker compose restart backend
docker compose restart frontend
```

### Ver logs en tiempo real
```bash
docker compose logs -f backend
```

### Actualizar el código desde GitHub
```bash
cd ~/paguito-telcel
git pull origin main
docker compose build
docker compose down
docker compose up -d
```

### O usar el script de deploy
```bash
cd ~/paguito-telcel
chmod +x deploy.sh
./deploy.sh
```

### Hacer backup de la base de datos
```bash
docker compose exec postgres pg_dump -U paguito paguito_telcel > backup.sql
```

### Conectar a la base de datos
```bash
docker compose exec postgres psql -U paguito paguito_telcel
```

### Ver uso de disco
```bash
df -h
```

### Ver uso de memoria
```bash
free -h
```

---

## Solución de problemas comunes

### "Connection refused" al intentar conectarme por SSH

**Causa:** El firewall de Oracle no tiene el puerto 22 abierto.

**Solución:** Andá a Oracle Console → Security Lists → Agregar regla de ingreso para puerto 22.

### Los contenedores no arrancan

**Solución:** Ver los logs:
```bash
docker compose logs backend
```

### "Cannot connect to database"

**Causa:** Las variables de entorno están mal configuradas.

**Solución:** Verificá el archivo `.env`:
```bash
cat .env
```

Asegurate que `DATABASE_URL` tenga el formato correcto y que postgres esté corriendo:
```bash
docker compose ps
```

### El frontend muestra "502 Bad Gateway"

**Causa:** El backend no está corriendo o no responde.

**Solución:**
```bash
docker compose logs backend
docker compose restart backend
```

### Se me llenó el disco

**Solución:** Limpiar imágenes Docker viejas:
```bash
docker system prune -a
```

**CUIDADO:** Esto borra TODO (imágenes, contenedores, volúmenes no usados). Solo usalo si estás seguro.

### No puedo ver el frontend desde mi navegador

**Causa:** El puerto 80 no está abierto en el firewall de Oracle.

**Solución:** Agregar regla de ingreso para puerto 80 en Security Lists.

### Olvidé mi contraseña del servidor

**Solución:** No podés recuperarla. Tenés que:
1. Ir a Oracle Console
2. Detener la VM
3. Crear una nueva VM con una nueva llave SSH
4. O adjuntar el volumen de la VM vieja a una nueva

**Por eso es importante guardar bien la llave privada.**
