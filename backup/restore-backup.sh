#!/bin/bash
# restore-backup.sh - Script para restaurar un backup de la base de datos

# Configuración
BACKUP_DIR="./backup"
DB_NAME="paguito_telcel"
DB_USER="paguito"

# Mostrar backups disponibles
echo "Backups disponibles:"
ls -la "$BACKUP_DIR"/paguito-*.sql.gz | head -10

# Si no se especifica un archivo, pedir al usuario que elija
if [ "$#" -eq 0 ]; then
  echo ""
  echo "Ingresa el nombre del backup a restaurar (ej: paguito-2026-04-02_02-00-01.sql.gz):"
  read -r BACKUP_FILE
else
  BACKUP_FILE="$1"
fi

# Verificar que el archivo existe
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
  echo "ERROR: El archivo $BACKUP_FILE no existe en $BACKUP_DIR"
  exit 1
fi

# Confirmar antes de restaurar
echo ""
echo "ADVERTENCIA: Esta acción sobrescribirá todos los datos actuales de la base de datos."
echo "Backup a restaurar: $BACKUP_FILE"
echo ""
read -p "¿Estás seguro de que quieres continuar? (s/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
  echo "Restauración cancelada"
  exit 1
fi

echo ""
echo "[$(date)] Iniciando restauración de la base de datos..."

# Detener el backend para evitar inconsistencias
echo "[$(date)] Deteniendo el backend..."
docker compose stop backend

# Restaurar el backup
echo "[$(date)] Restaurando base de datos desde $BACKUP_FILE..."
gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | docker exec -i paguito-postgres psql -U "$DB_USER" -d "$DB_NAME"

# Verificar que la restauración fue exitosa
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "[$(date)] Restauración completada exitosamente"
else
  echo "[$(date)] ERROR: Falló la restauración de la base de datos"
  docker compose start backend  # Intentar recuperar el backend
  exit 1
fi

# Reiniciar el backend
echo "[$(date)] Reiniciando el backend..."
docker compose start backend

echo "[$(date)] Proceso de restauración completado"