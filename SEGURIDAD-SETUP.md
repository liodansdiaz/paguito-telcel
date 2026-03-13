# 🔐 Configuración de Seguridad - Guía Rápida

Esta guía te ayudará a configurar los secrets y variables de entorno de forma segura.

---

## ⚡ Inicio Rápido (Desarrollo)

### 1. Backend

```bash
cd backend

# Copiar archivo de ejemplo
cp .env.example .env

# Generar secrets seguros
npm run generate-secrets

# Copiar los secrets generados al archivo .env
# (Abre .env.secrets para copiar los valores)

# Validar configuración
npm run env:validate

# Si todo está OK, iniciar
npm run dev
```

### 2. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar (usa proxy a backend en desarrollo)
npm run dev
```

---

## 🏭 Configuración para Producción

### Paso 1: Generar Secrets Nuevos

```bash
cd backend

# Generar secrets únicos para producción
npm run generate-secrets
```

**IMPORTANTE:** 
- ❌ NO reutilices los secrets de desarrollo
- ✅ Genera nuevos secrets para cada entorno (staging, producción)
- ✅ Guarda los secrets en un gestor de contraseñas seguro

### Paso 2: Configurar Variables de Producción

Crea un archivo `.env` con estas variables:

```bash
# Ambiente
NODE_ENV=production

# Base de datos (con SSL)
DATABASE_URL="postgresql://user:pass@prod-db-server:5432/paguito_prod?sslmode=require"

# JWT - Copiar de los secrets generados
JWT_SECRET="<copiar-del-generate-secrets>"
JWT_REFRESH_SECRET="<copiar-del-generate-secrets>"

# URLs (HTTPS obligatorio)
FRONTEND_URL="https://paguito-telcel.com"

# Redis (con contraseña obligatoria)
REDIS_ENABLED=true
REDIS_HOST="redis-server"
REDIS_PORT=6379
REDIS_PASSWORD="<copiar-del-generate-secrets>"

# Health check (token secreto)
HEALTH_CHECK_TOKEN="<generar-un-token-aleatorio>"

# Email (si vas a usar notificaciones)
NOTIFICATIONS_EMAIL=true
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-correo@gmail.com"
SMTP_PASS="tu-app-password-de-gmail"
EMAIL_FROM="Paguito Telcel <tu-correo@gmail.com>"

# Almacenamiento en la nube (Cloudinary recomendado)
CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"
```

### Paso 3: Validar

```bash
npm run env:validate
```

Debe mostrar:
- ✅ Sin errores críticos
- ⚠️ Puede haber advertencias menores (ok en desarrollo)

### Paso 4: Compilar y Desplegar

```bash
# Compilar
npm run build

# Aplicar migraciones de base de datos
npm run db:migrate:deploy

# Iniciar (producción)
npm start
```

---

## 🛡️ Mejores Prácticas de Seguridad

### ✅ HACER

1. **Generar secrets únicos por entorno**
   ```bash
   npm run generate-secrets  # Para desarrollo
   npm run generate-secrets  # Para producción (diferente)
   ```

2. **Usar gestores de secrets en producción**
   - AWS Secrets Manager
   - Google Secret Manager
   - HashiCorp Vault
   - Variables de entorno del servidor

3. **Validar antes de desplegar**
   ```bash
   npm run env:validate
   ```

4. **Rotar secrets periódicamente**
   - Cada 90 días mínimo
   - Inmediatamente si hay sospecha de compromiso

5. **Usar HTTPS en producción**
   - Let's Encrypt (gratis)
   - Cloudflare (gratis + protección DDoS)

### ❌ NO HACER

1. ❌ Commitear archivos `.env` a Git
2. ❌ Usar los mismos secrets en desarrollo y producción
3. ❌ Compartir secrets por email, Slack o chat
4. ❌ Usar valores de ejemplo en producción
5. ❌ Dejar Redis sin contraseña en producción
6. ❌ Usar HTTP en producción

---

## 🔧 Scripts Disponibles

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run generate-secrets` | Genera secrets criptográficamente seguros |
| `npm run env:validate` | Valida la configuración actual |
| `npm run dev` | Inicia servidor en desarrollo |
| `npm run build` | Compila para producción |
| `npm start` | Inicia servidor compilado |
| `npm run db:migrate:deploy` | Aplica migraciones (producción) |
| `npm test` | Ejecuta tests |

---

## 🚨 Troubleshooting

### Error: "JWT_SECRET no está definido"

```bash
# Solución:
cd backend
cp .env.example .env
npm run generate-secrets
# Copiar los valores de .env.secrets a .env
```

### Error: "JWT_SECRET debe tener al menos 64 caracteres"

```bash
# Solución: Generar nuevos secrets
npm run generate-secrets
# Copiar el nuevo JWT_SECRET al .env
```

### Error: "Variables de entorno faltantes"

```bash
# Ver qué falta:
npm run env:validate

# Revisar .env.example para ver todas las variables
cat .env.example
```

### Warning: "HTTPS recomendado en producción"

```bash
# Solución: Actualizar FRONTEND_URL
# En .env:
FRONTEND_URL="https://tu-dominio.com"  # NO http://
```

---

## 📚 Documentación Completa

Para más detalles, consulta:
- **Backend:** `backend/SECURITY.md` - Guía completa de seguridad
- **README:** `README.md` - Documentación general del proyecto

---

## ✅ Checklist de Producción

Antes de desplegar a producción, verifica:

```
Backend:
☐ Secrets generados con npm run generate-secrets
☐ JWT_SECRET y JWT_REFRESH_SECRET tienen 64+ caracteres
☐ NODE_ENV=production
☐ DATABASE_URL usa SSL
☐ FRONTEND_URL usa HTTPS
☐ REDIS_PASSWORD configurado (16+ caracteres)
☐ npm run env:validate pasa sin errores críticos
☐ Credenciales de prueba cambiadas (admin@paguito.com, etc.)

Frontend:
☐ VITE_API_URL apunta a la API de producción
☐ npm run build ejecutado sin errores
☐ Assets optimizados

Infraestructura:
☐ HTTPS/SSL configurado (certificado válido)
☐ Firewall configurado
☐ Backups automatizados de base de datos
☐ Monitoring configurado (Sentry, logs, etc.)
☐ Redis con contraseña
☐ PostgreSQL con conexión SSL

Seguridad:
☐ Secrets NO están en Git
☐ .env en .gitignore
☐ Logs no exponen información sensible
☐ CORS configurado correctamente
☐ Rate limiting activo
☐ Helmet configurado
```

---

## 💡 Consejos Adicionales

### Gmail para Notificaciones

Si usas Gmail para enviar emails:

1. Activa verificación en 2 pasos
2. Ve a: https://myaccount.google.com/apppasswords
3. Genera una "Contraseña de aplicación"
4. Usa esa contraseña en `SMTP_PASS` (no tu contraseña normal)

### Cloudinary para Imágenes

1. Regístrate en: https://cloudinary.com (gratis hasta 25GB)
2. Obtén tus credenciales del dashboard
3. Configura en `.env`:
   ```
   CLOUDINARY_CLOUD_NAME="tu-cloud-name"
   CLOUDINARY_API_KEY="tu-api-key"
   CLOUDINARY_API_SECRET="tu-api-secret"
   ```

---

## 📞 Soporte

Si tienes problemas de configuración:
1. Revisa `backend/SECURITY.md` para guía detallada
2. Ejecuta `npm run env:validate` para diagnóstico
3. Consulta los logs en `backend/logs/`
