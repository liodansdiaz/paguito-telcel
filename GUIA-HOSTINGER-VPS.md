# 🚀 GUÍA COMPLETA: DEPLOYMENT A HOSTINGER VPS CON DOCKER COMPOSE

Esta guía te lleva paso a paso para desplegar **Paguito Telcel** en un VPS de Hostinger usando Docker Compose de forma PROFESIONAL.

---

## 📋 ÍNDICE

1. [Análisis y Plan Recomendado](#1-análisis-y-plan-recomendado)
2. [Preparación Pre-Deployment](#2-preparación-pre-deployment)
3. [Compra y Configuración Inicial del VPS](#3-compra-y-configuración-inicial-del-vps)
4. [Configuración del Servidor](#4-configuración-del-servidor)
5. [Deployment con Docker Compose](#5-deployment-con-docker-compose)
6. [Configuración de Dominio y SSL](#6-configuración-de-dominio-y-ssl)
7. [CI/CD con GitHub Actions](#7-cicd-con-github-actions-opcional)
8. [Backups Automáticos](#8-backups-automáticos)
9. [Monitoreo y Mantenimiento](#9-monitoreo-y-mantenimiento)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. ANÁLISIS Y PLAN RECOMENDADO

### 🎯 Plan de Hostinger Recomendado

**KVM 2** - $8.99/mes (primer período), $14.99/mes (renovación)

| Recurso | Especificación | ¿Suficiente? |
|---------|----------------|--------------|
| **vCPU** | 2 cores | ✅ Más que suficiente |
| **RAM** | 8 GB | ✅ Perfecto (tu stack usa ~2-3 GB) |
| **Almacenamiento** | 100 GB NVMe SSD | ✅ Sobrado (DB + logs + imágenes) |
| **Bandwidth** | 8 TB/mes | ✅ Excesivo para tu tráfico esperado |

### 📊 Estimación de Recursos

Tu stack completo consume aproximadamente:

```
Frontend (Nginx):       ~50 MB RAM
Backend (Node.js):      ~200-300 MB RAM
PostgreSQL:             ~150-200 MB RAM
Redis:                  ~50-100 MB RAM
Evolution API:          ~200-300 MB RAM
PostgreSQL Evolution:   ~100-150 MB RAM
Docker overhead:        ~200 MB RAM
-------------------------
TOTAL:                  ~1-1.5 GB RAM
```

**Conclusión:** Con 8 GB de RAM, tenés margen de sobra para picos de tráfico y crecimiento.

### 💰 Costo Total Mensual

| Servicio | Costo |
|----------|-------|
| Hostinger VPS KVM 2 | $14.99/mes (renovación) |
| Dominio (opcional) | $10-15/año (~$1/mes) |
| Cloudinary (ya configurado) | $0 (free tier) |
| Gmail SMTP (ya configurado) | $0 |
| **TOTAL** | **~$15-16/mes** |

### 🆚 Comparación con Otras Opciones

| Proveedor | Costo Mensual | CI/CD Auto | Mantenimiento | Control Total |
|-----------|---------------|------------|---------------|---------------|
| **Hostinger VPS** | **$15** | ❌ (manual) | ⚠️ Manual | ✅ Sí |
| Render | $7-14 | ✅ Automático | ✅ Cero | ❌ Limitado |
| Oracle Cloud Free | $0 | ❌ (manual) | ⚠️ Manual | ✅ Sí |
| DigitalOcean | $12 | ❌ (manual) | ⚠️ Manual | ✅ Sí |

**Elegiste Hostinger VPS:** Buena elección si querés control total y TODO en un solo servidor.

---

## 2. PREPARACIÓN PRE-DEPLOYMENT

### 2.1 Checklist Antes de Comprar el VPS

- [ ] Código en GitHub (repositorio privado o público)
- [ ] Variables de entorno documentadas
- [ ] Secrets generados (JWT, Redis password)
- [ ] Cuenta de Cloudinary configurada (ya la tenés)
- [ ] Gmail App Password generado (si vas a usar email)
- [ ] Dominio comprado (opcional pero recomendado)

### 2.2 Generar Secrets de Producción

En tu máquina local, generá los secrets ANTES de desplegar:

```bash
# JWT_SECRET (64 caracteres hex)
openssl rand -hex 64

# JWT_REFRESH_SECRET (otro diferente)
openssl rand -hex 64

# REDIS_PASSWORD (32 caracteres base64)
openssl rand -base64 32

# DB_PASSWORD (genera uno seguro)
openssl rand -base64 24
```

**IMPORTANTE:** Guardá estos valores en un lugar seguro (password manager). Los vas a necesitar.

### 2.3 Preparar Archivo `.env` de Producción

Creá un archivo `.env.production` en tu máquina LOCAL (NO lo subas a GitHub):

```env
# ============================================
# PRODUCCIÓN - HOSTINGER VPS
# ============================================

# BASE DE DATOS (Paguito Telcel)
DB_USER=paguito
DB_PASSWORD=TU_PASSWORD_GENERADO_AQUI
DB_NAME=paguito_telcel
DB_PORT=5433

# JWT (CRÍTICO - Usar secrets generados)
JWT_SECRET=TU_JWT_SECRET_DE_64_CARACTERES
JWT_REFRESH_SECRET=TU_JWT_REFRESH_SECRET_DE_64_CARACTERES
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# SERVIDOR
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.com
# Si no tenés dominio todavía, poné: http://TU_IP_PUBLICA

# REDIS
REDIS_ENABLED=true
REDIS_PASSWORD=TU_REDIS_PASSWORD_GENERADO

# EMAIL (opcional)
NOTIFICATIONS_EMAIL=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# WHATSAPP - EVOLUTION API
NOTIFICATIONS_WHATSAPP=false
EVOLUTION_API_KEY=paguito-whatsapp-2026-secreto
EVOLUTION_INSTANCE_NAME=paguito
EVOLUTION_SERVER_URL=https://tu-dominio.com:8080
# O si no tenés dominio: http://TU_IP_PUBLICA:8080

# Base de datos de Evolution API
EVOLUTION_DB_USER=evolution
EVOLUTION_DB_PASSWORD=evolution_password_seguro
EVOLUTION_DB_NAME=evolution_db
EVOLUTION_PORT=8080

# CHAT IA (opcional)
GROQ_API_KEY=

# OTROS
DAILY_SUMMARY_HOUR=18
FRONTEND_PORT=80
```

### 2.4 Verificar que Docker Compose Funciona Localmente

Antes de subir al servidor, probá que todo funciona:

```bash
# En la raíz del proyecto
cp .env.production .env

# Levantar todo
docker compose up -d

# Verificar que todos los servicios están corriendo
docker compose ps

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Verificar que el frontend carga
curl http://localhost

# Verificar que el backend responde
curl http://localhost:3000/health

# Apagar todo
docker compose down
```

Si todo funciona bien, estás listo para el VPS.

---

## 3. COMPRA Y CONFIGURACIÓN INICIAL DEL VPS

### 3.1 Comprar el VPS en Hostinger

1. Ir a: https://www.hostinger.com/vps-hosting
2. Seleccionar **KVM 2** ($8.99/mes)
3. Elegir período: **2 años** (mejor precio)
4. Elegir ubicación del servidor:
   - **Recomendado para México:** `US West (Oregon)` o `US East (Virginia)`
   - Otras opciones: `Amsterdam` (Europa), `Singapore` (Asia)
5. Sistema operativo: **Ubuntu 22.04 LTS** (IMPORTANTE: NO elegir Ubuntu con panel preinstalado)
6. Completar compra

### 3.2 Acceder al VPS por Primera Vez

Hostinger te enviará un email con:
- **IP pública del servidor** (ej: `185.123.45.67`)
- **Usuario:** `root`
- **Contraseña:** (temporal, la vas a cambiar)

**Acceder por SSH:**

```bash
# En tu terminal local
ssh root@TU_IP_PUBLICA

# Te pedirá la contraseña (la del email)
# Primera vez te preguntará si confías en el host, escribí: yes
```

### 3.3 Cambiar Contraseña de Root (CRÍTICO)

```bash
# Una vez conectado al VPS
passwd

# Te pedirá:
# - Contraseña actual (la del email)
# - Nueva contraseña (usá una SEGURA)
# - Confirmar contraseña
```

### 3.4 Actualizar el Sistema

```bash
# Actualizar lista de paquetes
apt update

# Actualizar paquetes instalados
apt upgrade -y

# Instalar paquetes básicos
apt install -y curl wget git vim ufw fail2ban
```

---

## 4. CONFIGURACIÓN DEL SERVIDOR

### 4.1 Crear Usuario No-Root (Seguridad)

NO trabajes como `root` siempre. Creá un usuario dedicado:

```bash
# Crear usuario
adduser deploy

# Cuando te pregunte, poné una contraseña segura
# El resto de preguntas (nombre completo, etc.) podés skipearlas presionando Enter

# Darle permisos sudo
usermod -aG sudo deploy

# Permitir que use Docker (lo instalamos después)
usermod -aG docker deploy
```

### 4.2 Configurar SSH con el Nuevo Usuario

```bash
# Copiar las claves SSH de root al nuevo usuario
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

**Ahora podés conectarte con el nuevo usuario:**

```bash
# Desde tu máquina local (nueva terminal)
ssh deploy@TU_IP_PUBLICA
```

De ahora en adelante, usá este usuario (`deploy`).

### 4.3 Configurar Firewall (UFW)

```bash
# Verificar estado
sudo ufw status

# Permitir SSH (CRÍTICO - si no hacés esto te vas a lockear)
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir Evolution API (WhatsApp)
sudo ufw allow 8080/tcp

# Habilitar firewall
sudo ufw enable

# Verificar reglas
sudo ufw status verbose
```

### 4.4 Instalar Docker y Docker Compose

```bash
# Instalar Docker (script oficial)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# IMPORTANTE: Cerrar sesión y volver a conectarte para que el grupo tome efecto
exit

# Volver a conectar
ssh deploy@TU_IP_PUBLICA

# Verificar que Docker funciona SIN sudo
docker --version
docker ps

# Instalar Docker Compose (ya viene con Docker moderno, pero verificá)
docker compose version
```

### 4.5 Configurar Fail2Ban (Protección contra Brute Force)

```bash
# Fail2Ban ya está instalado, configurarlo
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editar configuración
sudo vim /etc/fail2ban/jail.local

# Buscar la sección [sshd] y verificar que esté:
# enabled = true
# maxretry = 3
# bantime = 3600

# Reiniciar Fail2Ban
sudo systemctl restart fail2ban

# Verificar estado
sudo systemctl status fail2ban
```

---

## 5. DEPLOYMENT CON DOCKER COMPOSE

### 5.1 Clonar el Repositorio

```bash
# Crear directorio para aplicaciones
mkdir -p ~/apps
cd ~/apps

# Clonar tu repositorio
git clone https://github.com/TU_USUARIO/paguito-telcel.git
cd paguito-telcel
```

**Si tu repo es privado:**

```bash
# Generar SSH key en el servidor
ssh-keygen -t ed25519 -C "deploy@hostinger"

# Copiar la clave pública
cat ~/.ssh/id_ed25519.pub

# Agregar esta clave a tu GitHub:
# GitHub → Settings → SSH and GPG keys → New SSH key

# Clonar con SSH
git clone git@github.com:TU_USUARIO/paguito-telcel.git
```

### 5.2 Configurar Variables de Entorno

```bash
# Crear archivo .env en la raíz del proyecto
vim .env

# Copiar el contenido de .env.production que preparaste antes
# Actualizar estos valores:
# - FRONTEND_URL con tu dominio o IP pública
# - EVOLUTION_SERVER_URL con tu dominio o IP pública
```

**IMPORTANTE:** Reemplazá `TU_IP_PUBLICA` con la IP real de tu VPS:

```bash
# Obtener tu IP pública
curl ifconfig.me
```

### 5.3 Configurar Nginx para Dominio (si tenés uno)

Si tenés dominio, actualizá `frontend/nginx.conf`:

```bash
vim frontend/nginx.conf
```

Cambiar:

```nginx
server_name localhost;
```

Por:

```nginx
server_name tu-dominio.com www.tu-dominio.com;
```

### 5.4 Build y Deploy

```bash
# En la raíz del proyecto (~/apps/paguito-telcel)

# Levantar todos los servicios
docker compose up -d

# Ver el progreso
docker compose logs -f

# Esperar a que todo esté listo (2-5 minutos la primera vez)
# Cuando veas "Server running on port 3000" estás listo
```

### 5.5 Verificar que Todo Funciona

```bash
# Verificar estado de los contenedores
docker compose ps

# Deberías ver:
# - paguito-postgres         (healthy)
# - paguito-redis            (healthy)
# - paguito-evolution-postgres (healthy)
# - paguito-evolution-api    (running)
# - paguito-backend          (running)
# - paguito-frontend         (running)

# Ver logs del backend
docker compose logs backend

# Ver logs del frontend
docker compose logs frontend

# Verificar que el frontend carga
curl http://localhost

# Verificar que el backend responde
curl http://localhost:3000/health
```

### 5.6 Ejecutar Migraciones y Seed

```bash
# Ejecutar migraciones de Prisma
docker compose exec backend npx prisma migrate deploy

# Cargar datos iniciales (admin + vendedores + productos)
docker compose exec backend npx prisma db seed
```

### 5.7 Verificar desde el Navegador

Abrí tu navegador y andá a:

```
http://TU_IP_PUBLICA
```

Deberías ver la página principal de Paguito Telcel.

**Probar login admin:**

```
http://TU_IP_PUBLICA/login

Email: admin@paguito.com
Password: Admin123!
```

**IMPORTANTE:** Cambiá la password del admin INMEDIATAMENTE desde el panel.

---

## 6. CONFIGURACIÓN DE DOMINIO Y SSL

### 6.1 Apuntar el Dominio al VPS

Si tenés un dominio (ej: `paguito-telcel.com`), configurá los registros DNS:

**En tu proveedor de dominio (GoDaddy, Namecheap, etc.):**

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | TU_IP_PUBLICA | 3600 |
| A | www | TU_IP_PUBLICA | 3600 |

**Esperar 5-30 minutos** para que los DNS se propaguen.

**Verificar:**

```bash
# Desde tu máquina local
nslookup tu-dominio.com
# Debería mostrar tu IP pública
```

### 6.2 Instalar Certbot (Let's Encrypt SSL)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# IMPORTANTE: Apagar los contenedores temporalmente (Certbot necesita puerto 80)
cd ~/apps/paguito-telcel
docker compose down
```

### 6.3 Obtener Certificado SSL

```bash
# Obtener certificado
sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Te va a preguntar:
# - Email (para notificaciones de renovación)
# - Aceptar términos de servicio: Yes
# - Compartir email con EFF: No (opcional)

# Si todo sale bien, verás:
# Congratulations! Your certificate has been saved at:
# /etc/letsencrypt/live/tu-dominio.com/fullchain.pem
# /etc/letsencrypt/live/tu-dominio.com/privkey.pem
```

### 6.4 Configurar Nginx con SSL

Creá un nuevo archivo de configuración Nginx:

```bash
sudo vim /etc/nginx/sites-available/paguito-telcel
```

Pegá esta configuración:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Docker frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Activar el sitio:**

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/paguito-telcel /etc/nginx/sites-enabled/

# Remover default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si todo OK, reiniciar Nginx
sudo systemctl restart nginx
```

### 6.5 Actualizar Docker Compose para SSL

Editá `docker-compose.yml` para cambiar el puerto del frontend:

```bash
vim ~/apps/paguito-telcel/docker-compose.yml
```

Cambiar la sección del frontend:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: paguito-frontend
  ports:
    - "8081:80"  # Cambiar de 80:80 a 8081:80
  depends_on:
    - backend
  restart: unless-stopped
```

Actualizar Nginx para que apunte al nuevo puerto:

```bash
sudo vim /etc/nginx/sites-available/paguito-telcel
```

Cambiar:

```nginx
proxy_pass http://localhost:80;
```

Por:

```nginx
proxy_pass http://localhost:8081;
```

**Reiniciar todo:**

```bash
cd ~/apps/paguito-telcel

# Bajar contenedores
docker compose down

# Subir con nueva configuración
docker compose up -d

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 6.6 Configurar Auto-Renovación de SSL

Certbot ya configuró un cron job automático, pero verificá:

```bash
# Probar renovación
sudo certbot renew --dry-run

# Si funciona, el certificado se renovará automáticamente cada 90 días
```

### 6.7 Verificar HTTPS

Andá a tu navegador:

```
https://tu-dominio.com
```

Deberías ver el candado verde y la app funcionando.

---

## 7. CI/CD CON GITHUB ACTIONS (OPCIONAL)

Si querés deployment automático desde GitHub (push → deploy automático), seguí estos pasos:

### 7.1 Configurar SSH desde GitHub al VPS

En el VPS:

```bash
# Generar una nueva SSH key SOLO para GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# NO ponerle passphrase (presionar Enter dos veces)

# Agregar la clave pública a authorized_keys
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

# Copiar la clave PRIVADA
cat ~/.ssh/github_actions_key
```

**Copiar TODO el contenido** (desde `-----BEGIN OPENSSH PRIVATE KEY-----` hasta `-----END OPENSSH PRIVATE KEY-----`).

### 7.2 Agregar Secret en GitHub

1. Ir a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. New repository secret:
   - **Name:** `VPS_SSH_KEY`
   - **Value:** (pegar la clave privada completa)
4. New repository secret:
   - **Name:** `VPS_HOST`
   - **Value:** `TU_IP_PUBLICA`
5. New repository secret:
   - **Name:** `VPS_USER`
   - **Value:** `deploy`

### 7.3 Crear GitHub Actions Workflow

Creá el archivo `.github/workflows/deploy.yml`:

```bash
mkdir -p .github/workflows
vim .github/workflows/deploy.yml
```

Contenido:

```yaml
name: Deploy to Hostinger VPS

on:
  push:
    branches:
      - main  # O la rama que uses para producción

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/apps/paguito-telcel
            git pull origin main
            docker compose down
            docker compose up -d --build
            docker compose exec -T backend npx prisma migrate deploy
            echo "Deployment completed successfully!"
```

### 7.4 Probar el Workflow

```bash
# Hacer un cambio pequeño
echo "# Test deployment" >> README.md

# Commit y push
git add .
git commit -m "test: deployment automation"
git push origin main

# Ir a GitHub → Actions
# Deberías ver el workflow corriendo
```

---

## 8. BACKUPS AUTOMÁTICOS

### 8.1 Script de Backup de PostgreSQL

Creá un script de backup:

```bash
mkdir -p ~/backups
vim ~/backups/backup-db.sh
```

Contenido:

```bash
#!/bin/bash

# Configuración
BACKUP_DIR=~/backups/postgresql
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de la base de datos de Paguito
docker compose -f ~/apps/paguito-telcel/docker-compose.yml exec -T postgres \
  pg_dump -U paguito paguito_telcel | gzip > $BACKUP_DIR/paguito_${DATE}.sql.gz

# Backup de la base de datos de Evolution
docker compose -f ~/apps/paguito-telcel/docker-compose.yml exec -T evolution-postgres \
  pg_dump -U evolution evolution_db | gzip > $BACKUP_DIR/evolution_${DATE}.sql.gz

# Eliminar backups antiguos
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

Darle permisos de ejecución:

```bash
chmod +x ~/backups/backup-db.sh
```

### 8.2 Configurar Cron Job para Backups Diarios

```bash
# Editar crontab
crontab -e

# Agregar al final (backup diario a las 3 AM)
0 3 * * * ~/backups/backup-db.sh >> ~/backups/backup.log 2>&1
```

### 8.3 Probar el Backup Manualmente

```bash
~/backups/backup-db.sh

# Verificar que se creó el archivo
ls -lh ~/backups/postgresql/
```

### 8.4 Restaurar desde Backup

Si necesitás restaurar:

```bash
# Descomprimir backup
gunzip -c ~/backups/postgresql/paguito_20260423_030000.sql.gz > restore.sql

# Restaurar a la base de datos
docker compose -f ~/apps/paguito-telcel/docker-compose.yml exec -T postgres \
  psql -U paguito -d paguito_telcel < restore.sql

# Limpiar
rm restore.sql
```

---

## 9. MONITOREO Y MANTENIMIENTO

### 9.1 Verificar Estado de los Servicios

Script útil para chequear todo:

```bash
vim ~/check-status.sh
```

Contenido:

```bash
#!/bin/bash

echo "=== DOCKER CONTAINERS ==="
docker compose -f ~/apps/paguito-telcel/docker-compose.yml ps

echo ""
echo "=== DISK USAGE ==="
df -h

echo ""
echo "=== MEMORY USAGE ==="
free -h

echo ""
echo "=== CPU LOAD ==="
uptime

echo ""
echo "=== RECENT LOGS (Backend) ==="
docker compose -f ~/apps/paguito-telcel/docker-compose.yml logs --tail=20 backend

echo ""
echo "=== FIREWALL STATUS ==="
sudo ufw status
```

Darle permisos:

```bash
chmod +x ~/check-status.sh
```

Ejecutar cuando quieras:

```bash
~/check-status.sh
```

### 9.2 Comandos Útiles

```bash
# Ver logs en tiempo real
cd ~/apps/paguito-telcel
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar un servicio específico
docker compose restart backend

# Ver uso de recursos
docker stats

# Limpiar imágenes y contenedores viejos
docker system prune -a

# Ver espacio en disco
df -h

# Ver procesos
htop  # (instalarlo con: sudo apt install htop)
```

### 9.3 Actualizar la Aplicación

Cuando hacés cambios en el código:

```bash
cd ~/apps/paguito-telcel

# Pull del código nuevo
git pull origin main

# Rebuild y restart
docker compose down
docker compose up -d --build

# Aplicar migraciones (si hay)
docker compose exec backend npx prisma migrate deploy
```

### 9.4 Logs de Nginx

```bash
# Ver logs de acceso
sudo tail -f /var/log/nginx/access.log

# Ver logs de errores
sudo tail -f /var/log/nginx/error.log
```

---

## 10. TROUBLESHOOTING

### ❌ Problema: No puedo acceder por SSH

**Solución:**

```bash
# Verificar que el puerto 22 está abierto
sudo ufw status

# Si no está, abrirlo
sudo ufw allow 22/tcp
```

### ❌ Problema: Docker dice "permission denied"

**Solución:**

```bash
# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a conectarte
exit
ssh deploy@TU_IP_PUBLICA
```

### ❌ Problema: "Port already in use"

**Solución:**

```bash
# Ver qué proceso está usando el puerto
sudo lsof -i :80
sudo lsof -i :443

# Matar el proceso (reemplazar PID con el número que te dio lsof)
sudo kill -9 PID
```

### ❌ Problema: SSL no funciona

**Verificar:**

```bash
# Verificar que Nginx está corriendo
sudo systemctl status nginx

# Verificar configuración de Nginx
sudo nginx -t

# Ver logs de errores
sudo tail -f /var/log/nginx/error.log

# Verificar que el certificado existe
sudo ls -la /etc/letsencrypt/live/tu-dominio.com/
```

### ❌ Problema: Backend no se conecta a la DB

**Solución:**

```bash
# Ver logs del backend
docker compose logs backend

# Ver logs de PostgreSQL
docker compose logs postgres

# Verificar que la DB está corriendo
docker compose exec postgres psql -U paguito -d paguito_telcel -c "SELECT 1;"
```

### ❌ Problema: Me quedé sin espacio en disco

**Solución:**

```bash
# Ver qué está ocupando espacio
du -sh ~/* | sort -h

# Limpiar Docker
docker system prune -a --volumes

# Limpiar logs viejos
sudo journalctl --vacuum-time=7d
```

### ❌ Problema: El servidor está lento

**Diagnosticar:**

```bash
# Ver uso de CPU y RAM
htop

# Ver uso de disco
iotop  # (instalar con: sudo apt install iotop)

# Ver qué contenedor usa más recursos
docker stats
```

---

## 📝 CHECKLIST FINAL

Después de completar el deployment, verificá:

- [ ] Frontend carga en `https://tu-dominio.com`
- [ ] Login de admin funciona
- [ ] Panel de admin muestra datos
- [ ] Catálogo de productos carga
- [ ] Crear una reserva de prueba funciona
- [ ] SSL está activo (candado verde)
- [ ] Firewall configurado (UFW)
- [ ] Fail2Ban activo
- [ ] Backups automáticos configurados
- [ ] Evolution API corriendo (si vas a usar WhatsApp)
- [ ] Monitoreo básico configurado
- [ ] CI/CD funcionando (si lo configuraste)

---

## 🎯 PRÓXIMOS PASOS

1. **Cambiar password del admin** desde el panel
2. **Configurar Evolution API** para WhatsApp (escanear QR)
3. **Habilitar notificaciones por email** (configurar SMTP)
4. **Cargar productos reales** desde el panel admin
5. **Configurar Google Analytics** (opcional)
6. **Agregar más vendedores** desde el panel
7. **Configurar backup a servicio externo** (Dropbox, Google Drive, S3)

---

## 💡 CONSEJOS PROFESIONALES

### Seguridad:
- ✅ Cambiá las passwords por defecto SIEMPRE
- ✅ NO uses `root` para trabajar, usá el usuario `deploy`
- ✅ Mantené el sistema actualizado: `sudo apt update && sudo apt upgrade`
- ✅ Monitoreá intentos de login fallidos: `sudo tail -f /var/log/auth.log`

### Performance:
- ✅ Configurá Redis para caché (ya está en el docker-compose)
- ✅ Habilitá GZIP en Nginx (mejora velocidad de carga)
- ✅ Optimizá imágenes antes de subirlas (usar Cloudinary automáticamente)

### Backups:
- ✅ Probá restaurar un backup ANTES de necesitarlo
- ✅ Guardá backups en otro servidor (no solo en el VPS)
- ✅ Automatizá backups de volúmenes Docker también

### Monitoreo:
- ✅ Configurá Uptime Robot (gratis) para alertas si el sitio cae
- ✅ Revisá logs semanalmente: `docker compose logs backend | grep ERROR`

---

## 🆘 CONTACTO Y SOPORTE

Si algo sale mal:

1. **Revisar logs:** `docker compose logs -f`
2. **Revisar esta guía:** Sección Troubleshooting
3. **Hostinger Support:** https://www.hostinger.com/support
4. **Documentación oficial:**
   - Docker: https://docs.docker.com/
   - Nginx: https://nginx.org/en/docs/
   - Certbot: https://certbot.eff.org/

---

**Guía creada:** 23 de Abril, 2026  
**Versión:** 1.0  
**Stack:** Node.js + React + PostgreSQL + Docker Compose  
**Plataforma:** Hostinger VPS KVM 2
