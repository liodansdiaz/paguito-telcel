-- =====================================================================
-- MIGRACIÓN: add_reservation_items_model
-- =====================================================================
-- IMPORTANTE: Los datos ya fueron migrados por el script migrate-reservation-data.ts
-- Esta migración solo limpia los campos viejos del schema
-- =====================================================================

-- Step 1: Eliminar índice viejo que usa los campos que vamos a borrar
DROP INDEX IF EXISTS "reservations_curp_tipoPago_estado_idx";

-- Step 2: Eliminar foreign key constraint del campo productId
ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "reservations_productId_fkey";

-- Step 3: Eliminar campos viejos (los datos ya están en reservation_items)
ALTER TABLE "reservations" DROP COLUMN IF EXISTS "productId";
ALTER TABLE "reservations" DROP COLUMN IF EXISTS "tipoPago";

-- Step 4: Limpiar valores viejos del enum EstadoReserva
-- NOTA: Ya no existen en la BD porque fueron migrados a COMPLETADA
ALTER TYPE "EstadoReserva" RENAME TO "EstadoReserva_old";
CREATE TYPE "EstadoReserva" AS ENUM ('NUEVA', 'ASIGNADA', 'EN_VISITA', 'PARCIAL', 'COMPLETADA', 'CANCELADA', 'SIN_STOCK');

-- Actualizar la columna para usar el nuevo enum
ALTER TABLE "reservations" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "reservations" ALTER COLUMN "estado" TYPE "EstadoReserva" USING ("estado"::text::"EstadoReserva");
ALTER TABLE "reservations" ALTER COLUMN "estado" SET DEFAULT 'NUEVA';

-- Eliminar el enum viejo
DROP TYPE "EstadoReserva_old";

-- Step 5: Agregar foreign keys a la tabla reservation_items (ya creada por el script de migración)
ALTER TABLE "reservation_items" 
  DROP CONSTRAINT IF EXISTS "reservation_items_reservationId_fkey";

ALTER TABLE "reservation_items" 
  ADD CONSTRAINT "reservation_items_reservationId_fkey" 
  FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservation_items" 
  DROP CONSTRAINT IF EXISTS "reservation_items_productId_fkey";

ALTER TABLE "reservation_items" 
  ADD CONSTRAINT "reservation_items_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "products"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
