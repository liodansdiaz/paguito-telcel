/**
 * Script de migración de datos ANTES de aplicar el nuevo schema
 * 
 * ESTE SCRIPT DEBE EJECUTARSE **ANTES** DE APLICAR LA MIGRACIÓN DE PRISMA
 * 
 * ¿Qué hace?
 * 1. Lee todas las reservas existentes (formato viejo con productId y tipoPago en Reservation)
 * 2. Crea la nueva tabla reservation_items
 * 3. Por cada reserva, crea un ReservationItem con los datos del producto
 * 4. Actualiza el estado de las reservas:
 *    - VENDIDA → COMPLETADA
 *    - NO_CONCRETADA → COMPLETADA
 * 5. Agrega el campo estadoDetalle a las reservas
 * 
 * NOTA: Este script NO elimina los campos viejos. Eso lo hace la migración de Prisma.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface OldReservation {
  id: string;
  estado: string;
  tipoPago: string;
  productId: string;
}

interface Product {
  id: string;
  precio: string;
}

async function main() {
  console.log('🚀 Iniciando migración de datos de reservas...\n');

  // Paso 1: Obtener todas las reservas del formato viejo
  const oldReservations = await prisma.$queryRaw<OldReservation[]>`
    SELECT id, estado, "tipoPago", "productId"
    FROM reservations
  `;

  console.log(`📊 Encontradas ${oldReservations.length} reservas para migrar\n`);

  // Paso 2: Crear el enum EstadoReservaItem (si no existe)
  console.log('📝 Creando enum EstadoReservaItem...');
  await prisma.$executeRaw`
    DO $$ BEGIN
      CREATE TYPE "EstadoReservaItem" AS ENUM (
        'PENDIENTE', 'EN_PROCESO', 'VENDIDO', 'NO_CONCRETADO', 'CANCELADO', 'SIN_STOCK'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log('✅ Enum creado\n');

  // Paso 3: Crear la tabla reservation_items (si no existe)
  console.log('📝 Creando tabla reservation_items...');
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "reservation_items" (
      "id" TEXT NOT NULL,
      "reservationId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "color" TEXT,
      "memoria" TEXT,
      "tipoPago" "TipoPago" NOT NULL DEFAULT 'CONTADO',
      "estado" "EstadoReservaItem" NOT NULL DEFAULT 'PENDIENTE',
      "precioCapturado" DECIMAL(10,2) NOT NULL,
      "notas" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "reservation_items_pkey" PRIMARY KEY ("id")
    );
  `;
  console.log('✅ Tabla creada\n');

  // Paso 4: Crear índices
  console.log('📝 Creando índices...');
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "reservation_items_reservationId_idx" ON "reservation_items"("reservationId");
  `;
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "reservation_items_productId_idx" ON "reservation_items"("productId");
  `;
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "reservation_items_tipoPago_estado_idx" ON "reservation_items"("tipoPago", "estado");
  `;
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "reservation_items_reservationId_estado_idx" ON "reservation_items"("reservationId", "estado");
  `;
  console.log('✅ Índices creados\n');

  // Paso 5: Agregar columna estadoDetalle a reservations (si no existe)
  console.log('📝 Agregando columna estadoDetalle...');
  await prisma.$executeRaw`
    DO $$ BEGIN
      ALTER TABLE reservations ADD COLUMN "estadoDetalle" JSONB;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;
  console.log('✅ Columna agregada\n');

  // Paso 6: Migrar datos por cada reserva
  console.log('🔄 Migrando datos de reservas...\n');
  
  for (const oldReservation of oldReservations) {
    try {
      // Obtener precio del producto
      const product = await prisma.$queryRaw<Product[]>`
        SELECT id, precio
        FROM products
        WHERE id = ${oldReservation.productId}
        LIMIT 1
      `;

      if (product.length === 0) {
        console.warn(`⚠️  Producto ${oldReservation.productId} no encontrado para reserva ${oldReservation.id}`);
        continue;
      }

      const precioCapturado = product[0].precio;

      // Mapear estado de reserva a estado de item
      let itemEstado: string;
      let newReservationEstado = oldReservation.estado;

      switch (oldReservation.estado) {
        case 'VENDIDA':
          itemEstado = 'VENDIDO';
          newReservationEstado = 'COMPLETADA';
          break;
        case 'NO_CONCRETADA':
          itemEstado = 'NO_CONCRETADO';
          newReservationEstado = 'COMPLETADA';
          break;
        case 'CANCELADA':
          itemEstado = 'CANCELADO';
          break;
        case 'SIN_STOCK':
          itemEstado = 'SIN_STOCK';
          break;
        case 'NUEVA':
        case 'ASIGNADA':
        case 'EN_VISITA':
          itemEstado = 'PENDIENTE';
          break;
        default:
          itemEstado = 'PENDIENTE';
      }

      // Generar ID para el item (usando formato UUID v4 simple)
      const itemId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Insertar el reservation_item
      await prisma.$executeRaw`
        INSERT INTO reservation_items (
          id, "reservationId", "productId", "tipoPago", estado, "precioCapturado", "createdAt", "updatedAt"
        )
        VALUES (
          ${itemId},
          ${oldReservation.id},
          ${oldReservation.productId},
          ${oldReservation.tipoPago}::"TipoPago",
          ${itemEstado}::"EstadoReservaItem",
          ${precioCapturado},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;

      // Actualizar estado de la reserva si cambió
      if (newReservationEstado !== oldReservation.estado) {
        // Primero actualizar el enum para permitir el valor COMPLETADA
        await prisma.$executeRaw`
          DO $$ BEGIN
            ALTER TYPE "EstadoReserva" ADD VALUE IF NOT EXISTS 'COMPLETADA';
            ALTER TYPE "EstadoReserva" ADD VALUE IF NOT EXISTS 'PARCIAL';
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `;

        await prisma.$executeRaw`
          UPDATE reservations
          SET estado = ${newReservationEstado}::"EstadoReserva"
          WHERE id = ${oldReservation.id}
        `;
      }

      // Agregar estadoDetalle inicial
      const estadoDetalle = JSON.stringify({
        total: 1,
        pendientes: itemEstado === 'PENDIENTE' ? 1 : 0,
        vendidos: itemEstado === 'VENDIDO' ? 1 : 0,
        cancelados: itemEstado === 'CANCELADO' ? 1 : 0,
        noConcretados: itemEstado === 'NO_CONCRETADO' ? 1 : 0,
      });

      await prisma.$executeRaw`
        UPDATE reservations
        SET "estadoDetalle" = ${estadoDetalle}::jsonb
        WHERE id = ${oldReservation.id}
      `;

      console.log(`   ✅ Reserva ${oldReservation.id}: ${oldReservation.estado} → ${newReservationEstado} (item: ${itemEstado})`);
    } catch (error) {
      console.error(`   ❌ Error migrando reserva ${oldReservation.id}:`, error);
      throw error;
    }
  }

  console.log(`\n✅ Migración completada: ${oldReservations.length} reservas migradas`);
  console.log('\n🎯 PRÓXIMO PASO: Ejecutar la migración de Prisma para eliminar los campos viejos');
  console.log('   Comando: npx prisma migrate dev --name add_reservation_items_model');
}

main()
  .catch(e => {
    console.error('\n❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
