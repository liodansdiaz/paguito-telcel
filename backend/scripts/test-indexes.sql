-- ============================================================================
-- SCRIPT DE TESTING DE ÍNDICES DE PERFORMANCE
-- ============================================================================
-- Este script te permite verificar que los 14 índices creados están siendo
-- utilizados correctamente por PostgreSQL en las queries más comunes.
--
-- Uso:
--   docker exec -i paguito-postgres psql -U paguito -d paguito_telcel < backend/scripts/test-indexes.sql
--
-- Busca en el output:
--   ✅ "Index Scan using [nombre_indice]" = índice está siendo usado
--   ❌ "Seq Scan" = escaneo secuencial (malo, no usa índice)
-- ============================================================================

\echo '============================================================================'
\echo 'TEST 1: Round Robin - Selección de siguiente vendedor'
\echo 'Índice esperado: users_isActive_rol_lastAssignedAt_createdAt_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM users 
WHERE "isActive" = true AND rol = 'VENDEDOR'
ORDER BY "lastAssignedAt" ASC NULLS FIRST, "createdAt" ASC
LIMIT 1;

\echo ''
\echo '============================================================================'
\echo 'TEST 2: Validación Crédito Único - QUERY MÁS CRÍTICO'
\echo 'Índice esperado: reservations_curp_tipoPago_estado_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM reservations
WHERE curp = 'AAAA123456HDFRNN01' 
  AND "tipoPago" = 'CREDITO'
  AND estado IN ('NUEVA', 'ASIGNADA', 'EN_VISITA');

\echo ''
\echo '============================================================================'
\echo 'TEST 3: Catálogo Público con Filtro de Marca'
\echo 'Índice esperado: products_isActive_marca_createdAt_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM products
WHERE "isActive" = true
  AND marca = 'Samsung'
ORDER BY "createdAt" DESC
LIMIT 20;

\echo ''
\echo '============================================================================'
\echo 'TEST 4: Catálogo Público sin Filtros'
\echo 'Índice esperado: products_isActive_createdAt_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM products
WHERE "isActive" = true
ORDER BY "createdAt" DESC
LIMIT 20;

\echo ''
\echo '============================================================================'
\echo 'TEST 5: Listado de Reservas del Vendedor con Filtros'
\echo 'Índice esperado: reservations_vendorId_estado_createdAt_idx'
\echo '============================================================================'
-- Nota: Reemplaza 'uuid-del-vendedor' con un UUID real de tu BD
EXPLAIN ANALYZE
SELECT * FROM reservations
WHERE "vendorId" IS NOT NULL
  AND estado IN ('ASIGNADA', 'EN_VISITA')
ORDER BY "createdAt" DESC
LIMIT 20;

\echo ''
\echo '============================================================================'
\echo 'TEST 6: Consulta Pública de Reserva por CURP'
\echo 'Índice esperado: reservations_curp_estado_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM reservations
WHERE curp = 'AAAA123456HDFRNN01'
  AND estado IN ('NUEVA', 'ASIGNADA', 'EN_VISITA', 'VENDIDA')
ORDER BY "createdAt" DESC
LIMIT 1;

\echo ''
\echo '============================================================================'
\echo 'TEST 7: Dashboard - Métricas por Estado'
\echo 'Índice esperado: reservations_estado_createdAt_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT COUNT(*) FROM reservations
WHERE estado = 'VENDIDA'
  AND "createdAt" >= CURRENT_DATE - INTERVAL '30 days';

\echo ''
\echo '============================================================================'
\echo 'TEST 8: Dashboard Vendedor - Visitas Pendientes Hoy'
\echo 'Índice esperado: reservations_vendorId_fechaPreferida_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM reservations
WHERE "vendorId" IS NOT NULL
  AND "fechaPreferida" >= CURRENT_DATE
  AND "fechaPreferida" < CURRENT_DATE + INTERVAL '1 day'
ORDER BY "fechaPreferida" ASC;

\echo ''
\echo '============================================================================'
\echo 'TEST 9: Filtros Admin - Listado de Clientes Activos'
\echo 'Índice esperado: customers_estado_createdAt_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM customers
WHERE estado = 'ACTIVO'
ORDER BY "createdAt" DESC
LIMIT 50;

\echo ''
\echo '============================================================================'
\echo 'TEST 10: Filtros Admin - Vendedores Activos'
\echo 'Índice esperado: users_isActive_rol_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM users
WHERE "isActive" = true
  AND rol = 'VENDEDOR'
ORDER BY nombre ASC;

\echo ''
\echo '============================================================================'
\echo 'TEST 11: Notificaciones - Buscar por Reserva y Estado'
\echo 'Índice esperado: notifications_reservationId_status_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM notifications
WHERE "reservationId" IN (
  SELECT id FROM reservations LIMIT 1
)
  AND status = 'SENT';

\echo ''
\echo '============================================================================'
\echo 'TEST 12: RefreshToken - Limpieza de Tokens Expirados'
\echo 'Índice esperado: refresh_tokens_userId_expiresAt_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM refresh_tokens
WHERE "userId" IS NOT NULL
  AND "expiresAt" < NOW()
  AND "revokedAt" IS NULL;

\echo ''
\echo '============================================================================'
\echo 'TEST 13: RefreshToken - Revocación por Usuario'
\echo 'Índice esperado: refresh_tokens_userId_revokedAt_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM refresh_tokens
WHERE "userId" IS NOT NULL
  AND "revokedAt" IS NULL;

\echo ''
\echo '============================================================================'
\echo 'TEST 14: PasswordResetToken - Validación de Token'
\echo 'Índice esperado: password_reset_tokens_userId_expiresAt_idx'
\echo '============================================================================'
EXPLAIN ANALYZE
SELECT * FROM password_reset_tokens
WHERE "userId" IS NOT NULL
  AND "expiresAt" > NOW()
  AND "usedAt" IS NULL;

\echo ''
\echo '============================================================================'
\echo 'RESUMEN: Ver Todos los Índices Creados'
\echo '============================================================================'
SELECT 
  tablename, 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes 
JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
WHERE schemaname = 'public' 
  AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;

\echo ''
\echo '============================================================================'
\echo 'ESTADÍSTICAS: Uso de Índices (después de ejecutar queries reales)'
\echo '============================================================================'
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as "Index Scans",
  idx_tup_read as "Tuples Read",
  idx_tup_fetch as "Tuples Fetched"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
ORDER BY idx_scan DESC;

\echo ''
\echo '============================================================================'
\echo '✅ TESTING COMPLETADO'
\echo '============================================================================'
\echo 'Revisa el output arriba y busca:'
\echo '  - "Index Scan using [nombre_indice]" = ✅ Índice funcionando'
\echo '  - "Seq Scan" = ❌ No usa índice (puede ser normal si tabla tiene pocos datos)'
\echo ''
\echo 'Nota: Con pocas filas en las tablas, PostgreSQL puede preferir Seq Scan.'
\echo '      Los índices mostrarán su verdadero valor con miles de registros.'
\echo '============================================================================'
