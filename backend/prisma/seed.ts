import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Seed de producción - CREA EL ADMINISTRADOR POR DEFECTO
 * 
 * Este seed se ejecuta con: npm run db:seed
 * 
 * Credenciales del admin (para desarrollo):
 *   Email: admin@paguito.com
 *   Password: PaguitoTelcel2024!
 * 
 * IMPORTANTE: En producción, cambiar la password inmediatamente
 */

async function main() {
  console.log('=== SEED: Creando usuarios iniciales ===\n');

  // ─────────────────────────────────────────────────────────────
  // ADMIN PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  const adminPassword = 'PaguitoTelcel2024!'; // Password por defecto - CAMBIAR EN PRODUCCIÓN
  const hashedAdmin = await bcrypt.hash(adminPassword, 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@paguito.com' },
    update: { password: hashedAdmin },
    create: {
      nombre: 'Administrador Paguito Telcel',
      email: 'admin@paguito.com',
      password: hashedAdmin,
      rol: 'ADMIN',
      zona: 'Tapachula',
      telefono: '9611234567',
      isActive: true,
    },
  });
  console.log('✅ Admin creado/actualizado:', admin.email);

  // ─────────────────────────────────────────────────────────────
  // VENDEDORES DE PRUEBA
  // ─────────────────────────────────────────────────────────────
  const vendedoresData = [
    { nombre: 'Roberto Gómez', email: 'roberto@paguito.com', zona: 'Centro Histórico', telefono: '5511234567' },
    { nombre: 'María Fernández', email: 'maria@paguito.com', zona: 'Polanco', telefono: '5522345678' },
    { nombre: 'Luis Martínez', email: 'luis@paguito.com', zona: 'Coyoacán', telefono: '5533456789' },
    { nombre: 'Ana López', email: 'ana@paguito.com', zona: 'Santa Fe', telefono: '5544567890' },
    { nombre: 'Carlos Ruiz', email: 'carlos@paguito.com', zona: 'Del Valle', telefono: '5555678901' },
  ];

  const vendPassword = 'Vend123!';
  const hashedVend = await bcrypt.hash(vendPassword, 12);
  
  for (const v of vendedoresData) {
    await prisma.user.upsert({
      where: { email: v.email },
      update: { password: hashedVend },
      create: { ...v, password: hashedVend, rol: 'VENDEDOR', isActive: true },
    });
    console.log('✅ Vendedor creado:', v.email);
  }

  // ─────────────────────────────────────────────────────────────
  // PRODUCTOS DE EJEMPLO
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== SEED: Creando productos de ejemplo ===\n');

  const productosData = [
    {
      sku: 'APL-14PM-256', nombre: 'iPhone 14 Pro Max', marca: 'Apple',
      descripcion: 'Pantalla Super Retina XDR 6.7", chip A16 Bionic, cámara 48MP, 5G',
      precio: 28999, precioAnterior: null, stock: 45, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '580',
      badge: 'Más Vendido',
      especificaciones: { pantalla: '6.7" Super Retina XDR', camara: '48MP', chip: 'A16 Bionic', bateria: '4323 mAh', conectividad: '5G' },
      imagenes: [], colores: ['Negro', 'Blanco', 'Azul', 'Morado'], memorias: ['256GB', '512GB', '1TB'],
    },
    {
      sku: 'SAM-S23U-512', nombre: 'Samsung Galaxy S23 Ultra', marca: 'Samsung',
      descripcion: 'Pantalla Dynamic AMOLED 6.8", chip Snapdragon 8 Gen 2, cámara 200MP, S Pen incluido',
      precio: 26499, precioAnterior: 28000, stock: 3, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '530',
      badge: 'Oferta',
      especificaciones: { pantalla: '6.8" Dynamic AMOLED', camara: '200MP', chip: 'Snapdragon 8 Gen 2', bateria: '5000 mAh', conectividad: '5G' },
      imagenes: [], colores: ['Negro', 'Cream', 'Verde'], memorias: ['512GB', '1TB'],
    },
    {
      sku: 'XIA-RN12-128', nombre: 'Xiaomi Redmi Note 12', marca: 'Xiaomi',
      descripcion: 'Pantalla AMOLED 6.67", chip Snapdragon 685, cámara 50MP',
      precio: 4599, precioAnterior: 6500, stock: 120, stockMinimo: 10,
      disponibleCredito: true, pagosSemanales: '92',
      badge: 'Nuevo',
      especificaciones: { pantalla: '6.67" AMOLED', camara: '50MP', chip: 'Snapdragon 685', bateria: '5000 mAh', conectividad: '4G' },
      imagenes: [], colores: ['Gris', 'Azul', 'Verde'], memorias: ['128GB', '256GB'],
    },
  ];

  for (const p of productosData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        ...p,
        precio: p.precio,
        precioAnterior: p.precioAnterior || undefined,
        pagosSemanales: p.pagosSemanales,
        especificaciones: p.especificaciones,
        isActive: true,
      },
    });
    console.log('✅ Producto creado:', p.nombre);
  }

  // ─────────────────────────────────────────────────────────────
  // SECCIONES DEL CHAT
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== SEED: Creando configuración del chat ===\n');

  const chatSections = [
    {
      section: 'general',
      title: 'INFORMACIÓN GENERAL',
      content: `- Negocio: Amigos Paguito Telcel
- Ubicación: Tapachula, Chiapas — también atendemos pueblos y comunidades cercanas
- Horario de atención:
    • Lunes a Viernes: 9:30 a.m. – 4:30 p.m.
    • Sábados: 9:30 a.m. – 2:30 p.m.
    • Domingos: cerrado`,
      order: 1,
      isActive: true,
    },
    {
      section: 'credito',
      title: 'CRÉDITO — CÓMO FUNCIONA',
      content: `- Vendemos celulares a crédito sin necesidad de que el cliente vaya a ninguna tienda.
- Nuestro vendedor va hasta la puerta de tu casa para realizar todo el trámite.
- Requisito único: presentar INE (credencial de elector) vigente.
- Plazos disponibles: 13 semanas, 26 semanas o 39 semanas.
- El enganche varía según el equipo que el cliente elija (consultar con el vendedor).
- No se necesita buró de crédito ni historial bancario.`,
      order: 2,
      isActive: true,
    },
    {
      section: 'formas_pago',
      title: 'FORMAS DE PAGO',
      content: `- Oxxo
- Bodega Aurrerá
- Transferencia electrónica vía Mercado Pago`,
      order: 3,
      isActive: true,
    },
  ];

  for (const section of chatSections) {
    await prisma.chatPromptSection.upsert({
      where: { section: section.section },
      update: {},
      create: section,
    });
    console.log('✅ Sección de chat creada:', section.section);
  }

  // ─────────────────────────────────────────────────────────────
  // CONFIGURACIÓN DE ASIGNACIÓN INICIAL
  // ─────────────────────────────────────────────────────────────
  const existingConfig = await prisma.configuracionAsignacion.findFirst();
  
  if (!existingConfig) {
    await prisma.configuracionAsignacion.create({
      data: {
        estrategia: 'ROUND_ROBIN',
      },
    });
    console.log('✅ Configuración de asignación creada: ROUND_ROBIN (por defecto)');
  } else {
    console.log('✅ Configuración de asignación ya existe:', existingConfig.estrategia);
  }

  console.log('\n========================================');
  console.log('✅ SEED COMPLETADO EXITOSAMENTE');
  console.log('========================================\n');
  console.log('Credenciales de acceso:');
  console.log('  Admin: admin@paguito.com / PaguitoTelcel2024!');
  console.log('  Vendedor: roberto@paguito.com / Vend123!');
  console.log('');
}

main()
  .catch((e) => { console.error('Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });