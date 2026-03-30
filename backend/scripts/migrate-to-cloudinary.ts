/**
 * Script de migración: sube imágenes locales existentes a Cloudinary.
 *
 * USO:
 *   1. Configurar variables de entorno de Cloudinary en .env
 *   2. Ejecutar: npx ts-node scripts/migrate-to-cloudinary.ts
 *
 * El script:
 *   - Busca todos los productos con imágenes locales (/uploads/...)
 *   - Sube cada imagen a Cloudinary
 *   - Actualiza las URLs en la base de datos
 *   - NO elimina los archivos locales (por seguridad)
 */

import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/config/database';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function migrate() {
  // Verificar configuración
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('ERROR: Faltan variables de entorno de Cloudinary.');
    console.error('Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env');
    process.exit(1);
  }

  console.log('=== Migracion de Imagenes a Cloudinary ===\n');
  console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);

  // Obtener todos los productos
  const products = await prisma.product.findMany({
    select: { id: true, nombre: true, imagenes: true },
  });

  console.log(`Productos encontrados: ${products.length}`);

  let totalImages = 0;
  let migratedImages = 0;
  let skippedImages = 0;
  let errorImages = 0;

  for (const product of products) {
    const imagenes = (product.imagenes as string[]) || [];
    if (imagenes.length === 0) continue;

    console.log(`\nProducto: "${product.nombre}" (${imagenes.length} imagen/es)`);
    const nuevasImagenes: string[] = [];

    for (const imgPath of imagenes) {
      totalImages++;

      // Si ya es URL de Cloudinary, mantenerla
      if (imgPath.includes('cloudinary.com')) {
        console.log(`  - Ya en Cloudinary: ${imgPath.substring(0, 60)}...`);
        nuevasImagenes.push(imgPath);
        skippedImages++;
        continue;
      }

      // Construir ruta local
      const localPath = path.join(process.cwd(), imgPath.replace(/^\//, ''));

      if (!fs.existsSync(localPath)) {
        console.log(`  - Archivo no encontrado: ${localPath}`);
        nuevasImagenes.push(imgPath); // Mantener la referencia original
        errorImages++;
        continue;
      }

      try {
        const result = await cloudinary.uploader.upload(localPath, {
          folder: 'paguito-telcel/productos',
          transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
          ],
        });

        nuevasImagenes.push(result.secure_url);
        console.log(`  + Subida: ${result.secure_url.substring(0, 60)}...`);
        migratedImages++;
      } catch (error) {
        console.error(`  ! Error subiendo ${imgPath}:`, error);
        nuevasImagenes.push(imgPath); // Mantener la referencia original
        errorImages++;
      }
    }

    // Actualizar producto con nuevas URLs
    const changed = nuevasImagenes.some((url, i) => url !== imagenes[i]);
    if (changed) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imagenes: nuevasImagenes },
      });
      console.log(`  -> Producto actualizado en DB`);
    }
  }

  console.log('\n=== Resumen ===');
  console.log(`Imagenes totales:      ${totalImages}`);
  console.log(`Migradas a Cloudinary: ${migratedImages}`);
  console.log(`Ya en Cloudinary:      ${skippedImages}`);
  console.log(`Errores:               ${errorImages}`);
  console.log('\nNOTA: Los archivos locales NO se eliminaron por seguridad.');
  console.log('Puedes eliminarlos manualmente despues de verificar que todo funciona.');

  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
