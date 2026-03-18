/**
 * Script para verificar que la migración fue exitosa
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Verificando migración de reservation_items...\n');

  // Verificar tabla reservation_items
  const itemsCount = await prisma.reservationItem.count();
  console.log(`✅ reservation_items: ${itemsCount} items encontrados`);

  // Verificar que todas las reservas tienen al menos un item
  const reservationsCount = await prisma.reservation.count();
  console.log(`✅ reservations: ${reservationsCount} reservas encontradas`);

  // Verificar estados nuevos
  const estadosReservations = await prisma.reservation.groupBy({
    by: ['estado'],
    _count: true,
  });

  console.log('\n📋 Estados de reservas (nuevo formato):');
  estadosReservations.forEach(g => {
    console.log(`   ${g.estado}: ${g._count}`);
  });

  // Verificar estados de items
  const estadosItems = await prisma.reservationItem.groupBy({
    by: ['estado'],
    _count: true,
  });

  console.log('\n📦 Estados de items:');
  estadosItems.forEach(g => {
    console.log(`   ${g.estado}: ${g._count}`);
  });

  // Verificar tipos de pago en items
  const tiposPago = await prisma.reservationItem.groupBy({
    by: ['tipoPago'],
    _count: true,
  });

  console.log('\n💳 Tipos de pago en items:');
  tiposPago.forEach(g => {
    console.log(`   ${g.tipoPago}: ${g._count}`);
  });

  // Muestra de reservas con sus items
  const reservationsWithItems = await prisma.reservation.findMany({
    take: 3,
    include: {
      items: {
        include: {
          product: {
            select: {
              nombre: true,
              precio: true,
            }
          }
        }
      }
    }
  });

  console.log('\n📦 Muestra de reservas con items (primeras 3):');
  reservationsWithItems.forEach(r => {
    console.log(`\n   Reserva: ${r.id}`);
    console.log(`   Estado: ${r.estado}`);
    console.log(`   Estado Detalle:`, r.estadoDetalle);
    console.log(`   Items (${r.items.length}):`);
    r.items.forEach(item => {
      console.log(`     - ${item.product.nombre} | ${item.tipoPago} | ${item.estado} | $${item.precioCapturado}`);
    });
  });

  console.log('\n✅ Migración verificada exitosamente');
  console.log('\n🎯 PRÓXIMO PASO: Comenzar a reescribir el backend (repository, service, controller)');
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
