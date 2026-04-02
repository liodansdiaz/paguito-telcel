# ============================================
# Dockerfile para el Backend de Paguito Telcel
# ============================================
# Este archivo le dice a Docker cómo construir
# la imagen del backend paso a paso.
# ============================================

# --- ETAPA 1: Instalar dependencias ---
FROM node:20-alpine AS deps

# Establecer directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar SOLO los archivos de dependencias primero
# Esto hace que Docker cachee las dependencias y no las
# reinstale si solo cambió el código fuente
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incluyendo devDependencies)
# Necesitamos prisma y typescript para generar y compilar
RUN npm ci

# --- ETAPA 2: Generar Prisma Client ---
FROM node:20-alpine AS prisma

WORKDIR /app

# Copiar dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copiar el schema de Prisma
COPY prisma ./prisma/

# Generar el cliente de Prisma
# Esto crea el código que se conecta a la base de datos
RUN npx prisma generate

# --- ETAPA 3: Compilar TypeScript ---
FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias y cliente de Prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./

# Copiar el código fuente
COPY tsconfig.json ./
COPY src ./src/

# Compilar TypeScript a JavaScript
# Esto convierte los .ts en .js en la carpeta dist/
RUN npm run build

# --- ETAPA 4: Imagen final de producción ---
FROM node:20-alpine AS production

WORKDIR /app

# Instalar solo las dependencias de producción (sin devDependencies)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copiar el cliente de Prisma generado
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/

# Copiar el código compilado de la etapa build
COPY --from=build /app/dist ./dist/

# Crear directorios necesarios
RUN mkdir -p /app/uploads /app/logs

# Exponer el puerto 3000 (el puerto donde corre Express)
EXPOSE 3000

# Comando que se ejecuta cuando arranca el contenedor
# Primero aplica las migraciones de la base de datos,
# después arranca el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
