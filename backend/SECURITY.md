# 🔐 Guía de Seguridad - Paguito Telcel

Este documento describe las mejores prácticas de seguridad para la configuración y despliegue de la aplicación.

---

## 📋 Tabla de Contenidos

- [Configuración Inicial](#configuración-inicial)
- [Generación de Secrets](#generación-de-secrets)
- [Variables de Entorno](#variables-de-entorno)
- [Producción](#producción)
- [Gestión de Secrets](#gestión-de-secrets)
- [Checklist de Seguridad](#checklist-de-seguridad)

---

## 🚀 Configuración Inicial

### 1. Clonar el repositorio y configurar variables de entorno

```bash
# Clonar
git clone <repo-url>
cd paguito-telcel/backend

# Instalar dependencias
npm install

# Copiar archivo de ejemplo
cp .env.example .env
```

### 2. Generar secrets seguros

**NUNCA uses los valores de ejemplo en producción.**

```bash
# Generar secrets criptográficamente seguros
npm run generate-secrets
```

Esto generará:
- `JWT_SECRET` (64 bytes en base64)
- `JWT_REFRESH_SECRET` (64 bytes en base64)
- `REDIS_PASSWORD` (32 bytes en base64)

Los valores se mostrarán en consola y se guardarán en `.env.secrets` (solo para referencia local).

### 3. Copiar secrets al archivo .env

Abre `.env.secrets` y copia los valores generados a tu archivo `.env`:

```bash
JWT_SECRET="<valor-generado>"
JWT_REFRESH_SECRET="<valor-generado>"
REDIS_PASSWORD="<valor-generado>"
```

### 4. Validar configuración

```bash
npm run env:validate
```

Si hay errores, el script te indicará qué variables faltan o están mal configuradas.

---

## 🔑 Generación de Secrets

### ¿Por qué son importantes los secrets?

Los secrets de JWT protegen la autenticación de tu aplicación:
- Si alguien obtiene tu `JWT_SECRET`, puede falsificar tokens y acceder como cualquier usuario
- Los secrets deben ser largos, aleatorios y únicos por entorno

### Métodos para generar secrets

**Método 1: Usando el script npm (Recomendado)**
```bash
npm run generate-secrets
```

**Método 2: OpenSSL (Linux/Mac)**
```bash
openssl rand -base64 64
```

**Método 3: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Método 4: PowerShell (Windows)**
```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Características de un secret seguro

✅ **BUENO:**
- Mínimo 64 caracteres (producción)
- Generado criptográficamente
- Aleatorio y único
- Diferente en cada entorno

❌ **MALO:**
- "mi_secreto_123"
- "change_this_in_production"
- Reutilizar el mismo secret en desarrollo y producción
- Secrets con palabras comunes

---

## 🌍 Variables de Entorno

### Variables Críticas (REQUERIDAS)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret para access tokens | (64+ chars, generado) |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens | (64+ chars, generado) |
| `FRONTEND_URL` | URL del frontend (CORS) | `https://paguito.com` |

### Variables de Producción

| Variable | Desarrollo | Producción |
|----------|------------|------------|
| `NODE_ENV` | `development` | `production` |
| `JWT_SECRET` | 32+ chars | **64+ chars** |
| `REDIS_PASSWORD` | Opcional | **REQUERIDO (16+ chars)** |
| `FRONTEND_URL` | `http://localhost:5173` | `https://` (SSL obligatorio) |
| `HEALTH_CHECK_TOKEN` | Opcional | **Recomendado** |

### Validación Automática

La aplicación valida automáticamente las variables al iniciar:

```typescript
// src/app.ts (línea 3)
validateEnvOrExit(); // Falla si hay errores críticos
```

Validaciones implementadas:
- ✅ Variables requeridas presentes
- ✅ Formato correcto (URLs, puertos, etc.)
- ✅ Longitud mínima de secrets (64 chars en producción)
- ✅ No contienen valores de ejemplo ("fallback", "change", etc.)
- ⚠️ Advertencias (HTTPS en producción, etc.)

---

## 🏭 Producción

### Checklist de Seguridad

Antes de desplegar a producción:

```bash
# 1. Verificar entorno
export NODE_ENV=production

# 2. Generar nuevos secrets (NUNCA reutilices los de desarrollo)
npm run generate-secrets

# 3. Actualizar .env con valores de producción
# ... editar .env ...

# 4. Validar configuración
npm run env:validate

# 5. Si todo está OK, compilar
npm run build

# 6. Iniciar
npm start
```

### Variables Específicas de Producción

```bash
# .env (PRODUCCIÓN)
NODE_ENV=production

# HTTPS obligatorio
FRONTEND_URL="https://paguito-telcel.com"

# Secrets únicos y largos
JWT_SECRET="<64+ caracteres generados>"
JWT_REFRESH_SECRET="<64+ caracteres generados>"

# Redis con contraseña obligatoria
REDIS_ENABLED=true
REDIS_PASSWORD="<16+ caracteres generados>"

# Health check protegido
HEALTH_CHECK_TOKEN="<token secreto>"

# Base de datos segura
DATABASE_URL="postgresql://user:pass@prod-server:5432/paguito_prod?ssl=true"
```

### Proteger Health Check Detallado

En producción, `/health/detailed` requiere un token:

```bash
curl -H "X-Health-Token: <tu-token>" https://api.paguito.com/health/detailed
```

---

## 🗄️ Gestión de Secrets

### ❌ NO HACER

- ❌ Commitear archivos `.env` a Git
- ❌ Compartir secrets en Slack, email o chat
- ❌ Reutilizar secrets entre entornos
- ❌ Usar valores de ejemplo en producción
- ❌ Hardcodear secrets en el código

### ✅ BUENAS PRÁCTICAS

#### Desarrollo Local

```bash
# .env (ignorado por Git)
JWT_SECRET="<secret de desarrollo>"
```

#### Staging/Producción

**Opción 1: Variables de entorno del sistema**
```bash
# Linux/Mac
export JWT_SECRET="<secret de producción>"
node dist/app.js
```

**Opción 2: Docker Secrets**
```yaml
# docker-compose.yml
secrets:
  jwt_secret:
    external: true

services:
  backend:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

**Opción 3: Gestores de secrets en la nube**

- **AWS Secrets Manager**
- **Google Secret Manager**
- **HashiCorp Vault**
- **Azure Key Vault**

Ejemplo con AWS:
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });
const secret = await client.send(new GetSecretValueCommand({ SecretId: 'paguito/jwt' }));
process.env.JWT_SECRET = secret.SecretString;
```

### Rotación de Secrets

**Frecuencia recomendada:**
- JWT secrets: Cada 90 días
- Passwords de BD: Cada 90 días
- API keys: Según política del proveedor

**Proceso de rotación (sin downtime):**

1. Generar nuevos secrets
2. Actualizar backend con soporte dual (acepta viejo y nuevo)
3. Desplegar backend
4. Actualizar clientes al nuevo secret
5. Remover soporte del secret viejo
6. Revocar secret viejo

---

## ✅ Checklist de Seguridad

### Desarrollo

- [ ] `.env` existe y no está en Git
- [ ] Secrets generados con `npm run generate-secrets`
- [ ] `npm run env:validate` pasa sin errores
- [ ] `.env.secrets` no está en Git (verificar `.gitignore`)

### Pre-Producción

- [ ] `NODE_ENV=production`
- [ ] Secrets únicos (diferentes a desarrollo)
- [ ] JWT secrets ≥ 64 caracteres
- [ ] Redis con contraseña (≥ 16 caracteres)
- [ ] `FRONTEND_URL` usa HTTPS
- [ ] Health check token configurado
- [ ] Base de datos usa SSL
- [ ] `npm run env:validate` pasa sin warnings críticos

### Producción

- [ ] Secrets almacenados en gestor seguro (no en archivos)
- [ ] Variables de entorno inyectadas por CI/CD
- [ ] Backup de secrets encriptado
- [ ] Logs no exponen secrets
- [ ] Monitoreo de acceso a secrets activo
- [ ] Plan de rotación de secrets definido
- [ ] Equipo entrenado en gestión de secrets

---

## 🆘 Troubleshooting

### Error: "JWT_SECRET no está definido"

**Causa:** El archivo `.env` no existe o la variable no está configurada.

**Solución:**
```bash
cp .env.example .env
npm run generate-secrets
# Copiar el valor generado a .env
```

### Error: "JWT_SECRET debe tener al menos 64 caracteres en producción"

**Causa:** El secret es muy corto para producción.

**Solución:**
```bash
npm run generate-secrets
# Usar el nuevo valor (64+ caracteres)
```

### Warning: "FRONTEND_URL debería usar HTTPS en producción"

**Causa:** Estás usando HTTP en producción (inseguro).

**Solución:**
```bash
# .env
FRONTEND_URL="https://tu-dominio.com"
```

### Error: "REDIS_PASSWORD es requerido cuando Redis está habilitado en producción"

**Causa:** Redis sin contraseña en producción es un riesgo de seguridad.

**Solución:**
```bash
npm run generate-secrets
# Copiar REDIS_PASSWORD al .env
```

---

## 📚 Referencias

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 📞 Contacto

Si encuentras un problema de seguridad, por favor **NO lo reportes públicamente**.

Contacta al equipo de desarrollo directamente.
