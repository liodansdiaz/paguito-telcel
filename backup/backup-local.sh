#!/bin/bash
# backup-local.sh - Script de backup automático local

# Configuración
BACKUP_DIR="./backup"
DB_NAME="paguito_telcel"
DB_USER="paguito"
RETENTION_DAYS=7  # Mantener 7 días (ajustable)

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Fecha y hora actual para el nombre del archivo
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/paguito-$DATE.sql.gz"

echo "[$(date)] Iniciando backup de la base de datos..."

# Ejecutar pg_dump dentro del contenedor de PostgreSQL y comprimir con gzip
docker exec paguito-postgres pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verificar que el backup se creó correctamente
if [ -f "$BACKUP_FILE" ]; then
  # Obtener tamaño del backup
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] Backup creado exitosamente: $BACKUP_FILE ($BACKUP_SIZE)"
else
  echo "[$(date)] ERROR: No se pudo crear el backup"
  exit 1
fi

# Eliminar backups viejos (más de RETENTION_DAYS días)
echo "[$(date)] Eliminando backups viejos (más de $RETENTION_DAYS días)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "paguito-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
  echo "[$(date)] Se eliminaron $DELETED_COUNT backups viejos"
else
  echo "[$(date)] No se encontraron backups viejos para eliminar"
fi

echo "[$(date)] Proceso de backup completado"