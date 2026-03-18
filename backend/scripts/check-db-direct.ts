/**
 * Script para verificar el estado de las reservas existentes antes de migración
 * Usa SQL raw porque el Prisma Client ya está actualizado con el nuevo schema
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Verificando reservas existentes (SQL directo)...\n');

  // Contar total de reservas
  const totalResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM reservations
  `;
  console.log(`📊 Total de reservas: ${totalResult[0].count}`);

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
  const byTipoPago = await prisma.$queryRaw<Array<{ tipoPago: string; count: bigint }>>`
    SELECT "tipoPago", COUNT(*) as count
    FROM reservations
    GROUP BY "tipoPago"
    ORDER BY count DESC
  `;

  console.log('\n💳 Reservas por tipo de pago:');
  byTipoPago.forEach(row => {
    console.log(`   ${row.tipoPago}: ${row.count}`);
  });

  // Verificar si existen los campos que vamos a eliminar
  const sampleReservations = await prisma.$queryRaw<Array<{
    id: string;
    estado: string;
    "tipoPago": string;
    "productId": string;
    "nombreCompleto": string;
  }>>`
    SELECT id, estado, "tipoPago", "productId", "nombreCompleto"
    FROM reservations
    LIMIT 5
  `;

  console.log('\n📦 Muestra de reservas (primeras 5):');
  sampleReservations.forEach(r => {
    console.log(`   [${r.id}] ${r.nombreCompleto} | Estado: ${r.estado} | Pago: ${r.tipoPago} | ProductID: ${r.productId}`);
  });

  console.log(`\n✅ Verificación completada`);
  console.log('\n⚠️  IMPORTANTE: Los campos productId y tipoPago serán movidos a la tabla reservation_items');
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
