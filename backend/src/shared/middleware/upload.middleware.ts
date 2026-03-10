import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Directorio donde se guardan las imágenes
const uploadsDir = path.join(process.cwd(), 'uploads', 'productos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipos MIME permitidos para imágenes
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  // Extensiones permitidas (como fallback)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  // Validar tanto MIME type como extensión
  // Esto previene archivos maliciosos disfrazados de imágenes
  if (allowedMimeTypes.includes(mime) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
  }
};

export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: {
    files: 3,          // máximo 3 imágenes
    fileSize: 5 * 1024 * 1024, // máximo 5MB por imagen
  },
}).array('imagenes', 3);
