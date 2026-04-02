#!/bin/bash
# ============================================
# Script de inicialización de Evolution API
# ============================================
# Este script crea automáticamente la instancia
# de WhatsApp cuando arranca el servidor.
#
# Solo crea la instancia si no existe.
# Si ya existe, no hace nada.
# ============================================

EVOLUTION_URL="http://evolution-api:8080"
API_KEY="${EVOLUTION_API_KEY:-paguito-whatsapp-2026-secreto}"
INSTANCE_NAME="${EVOLUTION_INSTANCE_NAME:-paguito}"

echo "========================================="
echo "  Inicializando Evolution API"
echo "========================================="

# Esperar a que Evolution API esté listo
echo "⏳ Esperando a que Evolution API inicie..."
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$EVOLUTION_URL" | grep -q "200\|301\|302"; then
        echo "✅ Evolution API está listo"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "   Intento $RETRY/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ Evolution API no respondió después de $MAX_RETRIES intentos"
    exit 1
fi

# Esperar un poco más para que la DB esté lista
sleep 3

# Verificar si la instancia ya existe
echo ""
echo "🔍 Verificando si la instancia '$INSTANCE_NAME' ya existe..."

EXISTING=$(curl -s "$EVOLUTION_URL/instance/fetchInstances" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json")

# Verificar si la instancia ya está creada
if echo "$EXISTING" | grep -q "\"instanceName\":\"$INSTANCE_NAME\""; then
    echo "✅ La instancia '$INSTANCE_NAME' ya existe"
    
    # Verificar el estado
    STATUS=$(echo "$EXISTING" | grep -o "\"status\":\"[^\"]*\"" | head -1)
    echo "   Estado: $STATUS"
    
    if echo "$STATUS" | grep -q "open"; then
        echo "✅ WhatsApp está CONECTADO"
    else
        echo "⚠️  WhatsApp NO está conectado"
        echo "   Andá a: http://TU_IP:8080/instance/connect/$INSTANCE_NAME"
        echo "   Y escaneá el QR con tu celular"
    fi
else
    echo "📝 Creando instancia '$INSTANCE_NAME'..."
    
    RESULT=$(curl -s -X POST "$EVOLUTION_URL/instance/create" \
        -H "apikey: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"instanceName\": \"$INSTANCE_NAME\",
            \"token\": \"paguito-token\",
            \"qrcode\": true,
            \"integration\": \"WHATSAPP-BAILEYS\"
        }")
    
    if echo "$RESULT" | grep -q "instanceName"; then
        echo "✅ Instancia '$INSTANCE_NAME' creada exitosamente"
        echo ""
        echo "📱 PASO SIGUIENTE:"
        echo "   1. Andá a: http://TU_IP:8080/instance/connect/$INSTANCE_NAME"
        echo "   2. Escaneá el QR con WhatsApp"
        echo "   3. WhatsApp → Configuración → Dispositivos vinculados"
        echo ""
        echo "   Una vez conectado, NO necesitás hacerlo de nuevo."
        echo "   La sesión se guarda y persiste entre reinicios."
    else
        echo "⚠️  La instancia pudo haberse creado o hubo un error:"
        echo "   $RESULT"
    fi
fi

echo ""
echo "========================================="
echo "  Evolution API listo"
echo "========================================="
