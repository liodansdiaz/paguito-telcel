import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed...');

  // Admin
  const adminPass = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@paguito.com' },
    update: {},
    create: {
      nombre: 'Admin Paguito',
      email: 'admin@paguito.com',
      password: adminPass,
      rol: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin creado:', admin.email);

  // Vendedores
  const vendedoresData = [
    { nombre: 'Roberto Gómez', email: 'roberto@paguito.com', zona: 'Centro Histórico', telefono: '5511234567' },
    { nombre: 'María Fernández', email: 'maria@paguito.com', zona: 'Polanco', telefono: '5522345678' },
    { nombre: 'Luis Martínez', email: 'luis@paguito.com', zona: 'Coyoacán', telefono: '5533456789' },
    { nombre: 'Ana López', email: 'ana@paguito.com', zona: 'Santa Fe', telefono: '5544567890' },
    { nombre: 'Carlos Ruiz', email: 'carlos@paguito.com', zona: 'Del Valle', telefono: '5555678901' },
  ];

  const vendPass = await bcrypt.hash('Vend123!', 12);
  for (const v of vendedoresData) {
    await prisma.user.upsert({
      where: { email: v.email },
      update: {},
      create: { ...v, password: vendPass, rol: 'VENDEDOR', isActive: true },
    });
    console.log('Vendedor creado:', v.email);
  }

  // Productos
  const productosData = [
    {
      sku: 'APL-14PM-256', nombre: 'iPhone 14 Pro Max', marca: 'Apple',
      descripcion: 'Pantalla Super Retina XDR 6.7", chip A16 Bionic, cámara 48MP, 5G',
      precio: 28999, precioAnterior: null, stock: 45, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '580',
      badge: 'Más Vendido',
      especificaciones: { pantalla: '6.7" Super Retina XDR', camara: '48MP', chip: 'A16 Bionic', bateria: '4323 mAh', conectividad: '5G' },
      imagenes: ['iphone14-promax-negro.jpg', 'iphone14-promax-blanco.jpg', 'iphone14-promax-azul.jpg', 'iphone14-promax-morado.jpg'],
      imagenesColores: ['Negro', 'Blanco', 'Azul Oscuro', 'Morado'],
      colores: ['Negro', 'Blanco', 'Azul Oscuro', 'Morado'],
      memorias: ['256GB', '512GB', '1TB'],
    },
    {
      sku: 'SAM-S23U-512', nombre: 'Samsung Galaxy S23 Ultra', marca: 'Samsung',
      descripcion: 'Pantalla Dynamic AMOLED 6.8", chip Snapdragon 8 Gen 2, cámara 200MP, S Pen incluido',
      precio: 26499, precioAnterior: 28000, stock: 3, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '530',
      badge: 'Oferta',
      especificaciones: { pantalla: '6.8" Dynamic AMOLED', camara: '200MP', chip: 'Snapdragon 8 Gen 2', bateria: '5000 mAh', conectividad: '5G' },
      imagenes: ['samsung-s23ultra-negro.jpg', 'samsung-s23ultra-cream.jpg', 'samsung-s23ultra-verde.jpg'],
      imagenesColores: ['Negro', 'Cream', 'Verde'],
      colores: ['Negro', 'Cream', 'Verde'],
      memorias: ['512GB', '1TB'],
    },
    {
      sku: 'XIA-RN12-128', nombre: 'Xiaomi Redmi Note 12', marca: 'Xiaomi',
      descripcion: 'Pantalla AMOLED 6.67", chip Snapdragon 685, cámara 50MP',
      precio: 4599, precioAnterior: 6500, stock: 120, stockMinimo: 10,
      disponibleCredito: true, pagosSemanales: '92',
      badge: 'Nuevo Ingreso',
      especificaciones: { pantalla: '6.67" AMOLED', camara: '50MP', chip: 'Snapdragon 685', bateria: '5000 mAh', conectividad: '4G' },
      imagenes: ['xiaomi-rn12-gris.jpg', 'xiaomi-rn12-azul.jpg', 'xiaomi-rn12-verde.jpg'],
      imagenesColores: ['Gris', 'Azul', 'Verde'],
      colores: ['Gris', 'Azul', 'Verde'],
      memorias: ['128GB', '256GB'],
    },
    {
      sku: 'MOT-ED40-256', nombre: 'Motorola Edge 40', marca: 'Motorola',
      descripcion: 'Pantalla pOLED 6.55" 144Hz, chip MediaTek Dimensity 8020, cámara 50MP, carga 68W',
      precio: 9999, precioAnterior: null, stock: 15, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '200',
      badge: null,
      especificaciones: { pantalla: '6.55" pOLED 144Hz', camara: '50MP', chip: 'Dimensity 8020', bateria: '4400 mAh', conectividad: '5G' },
      imagenes: ['motorola-edge40-negro.jpg', 'motorola-edge40-verde.jpg'],
      imagenesColores: ['Negro', 'Verde Menta'],
      colores: ['Negro', 'Verde Menta'],
      memorias: ['256GB'],
    },
    {
      sku: 'APL-13MN-128', nombre: 'iPhone 13 Mini', marca: 'Apple',
      descripcion: 'Pantalla Super Retina XDR 5.4", chip A15 Bionic, cámara dual 12MP',
      precio: 14999, precioAnterior: null, stock: 4, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '300',
      badge: null,
      especificaciones: { pantalla: '5.4" Super Retina XDR', camara: '12MP Dual', chip: 'A15 Bionic', bateria: '2438 mAh', conectividad: '5G' },
      imagenes: ['iphone13mini-azul.jpg', 'iphone13mini-blanco.jpg', 'iphone13mini-negro.jpg', 'iphone13mini-rosa.jpg'],
      imagenesColores: ['Azul', 'Blanco', 'Negro', 'Rosa'],
      colores: ['Azul', 'Blanco', 'Negro', 'Rosa'],
      memorias: ['128GB', '256GB'],
    },
    {
      sku: 'SAM-A54-256', nombre: 'Samsung Galaxy A54 5G', marca: 'Samsung',
      descripcion: 'Pantalla Super AMOLED 6.4", chip Exynos 1380, cámara 50MP OIS, 5G',
      precio: 8999, precioAnterior: null, stock: 30, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '180',
      badge: null,
      especificaciones: { pantalla: '6.4" Super AMOLED', camara: '50MP OIS', chip: 'Exynos 1380', bateria: '5000 mAh', conectividad: '5G' },
      imagenes: ['samsung-a54-negro.jpg', 'samsung-a54-blanco.jpg', 'samsung-a54-lavanda.jpg'],
      imagenesColores: ['Negro', 'Blanco', 'Lavanda'],
      colores: ['Negro', 'Blanco', 'Lavanda'],
      memorias: ['128GB', '256GB'],
    },
    {
      sku: 'HON-M5L-256', nombre: 'Honor Magic5 Lite', marca: 'Honor',
      descripcion: 'Pantalla AMOLED 6.67" 120Hz, chip Snapdragon 695, cámara 64MP',
      precio: 6499, precioAnterior: null, stock: 20, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '130',
      badge: null,
      especificaciones: { pantalla: '6.67" AMOLED 120Hz', camara: '64MP', chip: 'Snapdragon 695', bateria: '5100 mAh', conectividad: '5G' },
      imagenes: ['honor-m5lite-verde.jpg', 'honor-m5lite-plata.jpg', 'honor-m5lite-negro.jpg'],
      imagenesColores: ['Verde', 'Plata', 'Negro'],
      colores: ['Verde', 'Plata', 'Negro'],
      memorias: ['256GB'],
    },
    {
      sku: 'OPP-RN10-256', nombre: 'OPPO Reno 10 5G', marca: 'OPPO',
      descripcion: 'Pantalla AMOLED 6.7" 120Hz, chip Snapdragon 778G, cámara telefoto 32MP',
      precio: 9999, precioAnterior: null, stock: 12, stockMinimo: 5,
      disponibleCredito: true, pagosSemanales: '200',
      badge: null,
      especificaciones: { pantalla: '6.7" AMOLED 120Hz', camara: '64MP + 32MP Telefoto', chip: 'Snapdragon 778G', bateria: '5000 mAh', conectividad: '5G' },
      imagenes: ['oppo-rn10-azul.jpg', 'oppo-rn10-gris.jpg'],
      imagenesColores: ['Azul', 'Gris'],
      colores: ['Azul', 'Gris'],
      memorias: ['256GB'],
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
    console.log('Producto creado:', p.nombre);
  }

  console.log('Seed completado exitosamente.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
