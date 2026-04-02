#!/bin/bash
# ============================================
# Script de Deploy - Paguito Telcel
# ============================================
# Este script actualiza y reinicia la aplicación
# en el servidor de producción.
#
# Uso: ./deploy.sh
# ============================================

set -e  # Si algo falla, para todo

echo "========================================="
echo "  Deploy de Paguito Telcel"
echo "========================================="
echo ""

# 1. Obtener cambios de GitHub
echo "🔄 Obteniendo cambios de GitHub..."
git pull origin main
echo "✅ Código actualizado"
echo ""

# 2. Reconstruir los contenedores
echo "📦 Reconstruyendo imágenes Docker..."
docker compose build --no-cache
echo "✅ Imágenes construidas"
echo ""

# 3. Aplicar migraciones de base de datos
echo "🗄️ Aplicando migraciones de base de datos..."
docker compose run --rm backend npx prisma migrate deploy
echo "✅ Migraciones aplicadas"
echo ""

# 4. Reiniciar los servicios
echo "🚀 Reiniciando servicios..."
docker compose down
docker compose up -d
echo "✅ Servicios iniciados"
echo ""

# 5. Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios inicien..."
sleep 8

# 6. Verificar que todo esté funcionando
echo "🔍 Verificando estado de los servicios..."
docker compose ps
echo ""

# 7. Verificar estado de WhatsApp
echo "📱 Verificando estado de WhatsApp..."
EVOLUTION_STATUS=$(curl -s http://localhost:8080/instance/fetchInstances \
  -H "apikey: ${EVOLUTION_API_KEY:-paguito-whatsapp-2026-secreto}" 2>/dev/null || echo "[]")

if echo "$EVOLUTION_STATUS" | grep -q '"status":"open"'; then
    echo "✅ WhatsApp está CONECTADO"
elif echo "$EVOLUTION_STATUS" | grep -q '"instanceName"'; then
    echo "⚠️  WhatsApp NO está conectado"
    echo "   Escaneá el QR en: http://$(curl -s ifconfig.me 2>/dev/null || echo 'TU_IP'):8080/instance/connect/paguito"
else
    echo "⚠️  WhatsApp no configurado o no disponible"
fi
echo ""

# 8. Limpiar imágenes viejas
echo "🧹 Limpiando imágenes viejas..."
docker image prune -f
echo ""

# 9. Mostrar URLs
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "TU_IP_PUBLICA")

echo "========================================="
echo "  ✅ Deploy completado exitosamente"
echo "========================================="
echo ""
echo "  Frontend:    http://$PUBLIC_IP"
echo "  Backend:     http://$PUBLIC_IP:3000"
echo "  Health:      http://$PUBLIC_IP/health"
echo "  Evolution:   http://$PUBLIC_IP:8080"
echo ""
