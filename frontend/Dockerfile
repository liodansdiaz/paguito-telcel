# ============================================
# Dockerfile para el Frontend de Paguito Telcel
# ============================================
# Este archivo construye el frontend de React
# y lo sirve con Nginx (un servidor web rápido).
# ============================================

# --- ETAPA 1: Construir el frontend ---
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias primero (cache)
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Variable de entorno para la URL del backend
# En producción, el frontend se sirve desde el mismo dominio
# que el backend, así que usamos rutas relativas (/api)
ARG VITE_BACKEND_URL=/api
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Compilar el frontend
# Esto ejecuta: tsc -b && vite build
# Genera una carpeta dist/ con archivos HTML, JS, CSS minificados
RUN npm run build

# --- ETAPA 2: Servir con Nginx ---
FROM nginx:alpine AS production

# Copiar nuestra configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados del frontend al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Nginx arranca automáticamente cuando el contenedor inicia
# No necesitamos CMD porque la imagen de nginx ya tiene uno
