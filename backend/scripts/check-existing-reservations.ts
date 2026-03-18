/**
 * Script para verificar el estado de las reservas existentes antes de migración
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando reservas existentes...\n');

  // Contar total de reservas
  const totalReservations = await prisma.reservation.count();
  console.log(`📊 Total de reservas: ${totalReservations}`);

  // Contar por estado
  const byState = await prisma.$queryRaw<Array<{ estado: string; count: bigint }>>`
    SELECT estado, COUNT(*) as count
    FROM reservations
    GROUP BY estado
    ORDER BY count DESC
  `;

  console.log('\n📋 Reservas por estado:');
  byState.forEach(row => {
    console.log(`   ${row.estado}: ${row.count}`);
  });

  // Contar por tipo de pago
  const byTipoPago = await prisma.$queryRaw<Array<{ "tipoPago": string; count: bigint }>>`
    SELECT "tipoPago", COUNT(*) as count
    FROM reservations
    GROUP BY "tipoPago"
    ORDER BY count DESC
  `;

  console.log('\n💳 Reservas por tipo de pago:');
  byTipoPago.forEach(row => {
    console.log(`   ${row.tipoPago}: ${row.count}`);
  });

  // Obtener todas las reservas con sus productos
  const allReservations = await prisma.reservation.findMany({
    select: {
      id: true,
      folio: true,
      estado: true,
      tipoPago: true,
      productId: true,
      product: {
        select: {
          nombre: true,
          precio: true,
        }
      }
    }
  });

  console.log('\n📦 Detalle de reservas:');
  allReservations.forEach(r => {
    console.log(`   [${r.folio}] Estado: ${r.estado} | Pago: ${r.tipoPago} | Producto: ${r.product?.nombre || 'N/A'}`);
  });

  console.log(`\n✅ Verificación completada`);
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
