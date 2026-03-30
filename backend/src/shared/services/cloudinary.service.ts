import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Configurar Cloudinary con las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Verifica si Cloudinary está configurado correctamente.
 */
const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Sube un archivo a Cloudinary y devuelve la URL pública.
 * Si Cloudinary no está configurado, devuelve la ruta local como fallback.
 *
 * @param filePath - Ruta local del archivo temporal (lo que Multer generó)
 * @param folder - Subcarpeta en Cloudinary (default: 'productos')
 * @returns URL HTTPS de Cloudinary o ruta local relativa
 */
export async function uploadToCloudinary(
  filePath: string,
  folder: string = 'productos'
): Promise<string> {
  const configured = isCloudinaryConfigured();

  if (!configured) {
    logger.warn('[Cloudinary] NO configurado - usando almacenamiento local');
    const filename = path.basename(filePath);
    return `/uploads/productos/${filename}`;
  }

  logger.info(`[Cloudinary] Subiendo: ${filePath}`);

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `paguito-telcel/${folder}`,
      transformation: [
        {
          width: 800,
          height: 800,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    logger.info(`[Cloudinary] OK: ${result.secure_url}`);
    return result.secure_url;
  } catch (error: any) {
    logger.error('[Cloudinary] ERROR al subir:', error?.message || error);
    logger.error('[Cloudinary] Fallback a almacenamiento local');
    const filename = path.basename(filePath);
    return `/uploads/productos/${filename}`;
  }
}

/**
 * Elimina una imagen de Cloudinary por su URL.
 * Si es una URL local, elimina el archivo del disco.
 * Si es una URL de Cloudinary, extrae el public_id y lo elimina del CDN.
 *
 * @param imageUrl - URL de la imagen (Cloudinary o local)
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  // Si no es URL de Cloudinary, es ruta local → eliminar del disco
  if (!imageUrl.includes('cloudinary.com')) {
    const localPath = imageUrl.replace(/^\//, ''); // Quitar / inicial si existe
    const fullPath = path.join(process.cwd(), localPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`Imagen eliminada del disco: ${fullPath}`);
    }
    return;
  }

  // Si Cloudinary no está configurado, no intentar eliminar
  if (!isCloudinaryConfigured()) {
    return;
  }

  try {
    // Extraer public_id de la URL de Cloudinary
    // Ejemplo URL: https://res.cloudinary.com/demo/image/upload/v1234/paguito-telcel/productos/abc123.jpg
    // public_id: paguito-telcel/productos/abc123
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');
    if (uploadIndex === -1) return;

    // Tomar todo después de /upload/ y quitar la extensión
    let publicIdParts = urlParts.slice(uploadIndex + 1);

    // Si el primer segmento es una versión (v1234), saltarlo
    if (publicIdParts[0]?.match(/^v\d+$/)) {
      publicIdParts = publicIdParts.slice(1);
    }

    const publicId = publicIdParts.join('/').replace(/\.[^.]+$/, ''); // Quitar extensión

    await cloudinary.uploader.destroy(publicId);
    logger.info(`Imagen eliminada de Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Error eliminando imagen de Cloudinary:', error);
    // No lanzar error, es una operación secundaria
  }
}

export { isCloudinaryConfigured };
