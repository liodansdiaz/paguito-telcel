import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { productService } from './product.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.helper';
import type { ProductSort } from './product.repository';
import { uploadProductImages } from '../../shared/middleware/upload.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../../shared/services/cloudinary.service';

const createProductSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido'),
  nombre: z.string().min(1, 'El nombre del producto es requerido'),
  marca: z.string().min(1, 'La marca es requerida'),
  descripcion: z.string().optional(),
  precio: z.number({ invalid_type_error: 'El precio debe ser un número' }).positive('El precio debe ser mayor a cero'),
  precioAnterior: z.number({ invalid_type_error: 'El precio anterior debe ser un número' }).positive().nullable().optional(),
  stock: z.number({ invalid_type_error: 'El stock debe ser un número' }).int('El stock debe ser un número entero').min(0, 'El stock no puede ser negativo'),
  stockMinimo: z.number({ invalid_type_error: 'El stock mínimo debe ser un número' }).int('El stock mínimo debe ser un número entero').min(0, 'El stock mínimo no puede ser negativo').optional(),
  imagenes: z.array(z.string()).optional(),
  imagenesColores: z.array(z.string(), { invalid_type_error: 'Debe seleccionar al menos un color para las imágenes' }).optional(),
  colores: z.union([
    z.array(z.string()).min(1, 'Debe seleccionar al menos un color disponible'),
    z.undefined()
  ], { invalid_type_error: 'Debe seleccionar al menos un color disponible' }).optional(),
  memorias: z.union([
    z.array(z.string()).min(1, 'Debe seleccionar al menos una opción de almacenamiento'),
    z.undefined()
  ], { invalid_type_error: 'Debe seleccionar al menos una opción de almacenamiento' }).optional(),
  badge: z.string().optional(),
  disponibleCredito: z.boolean().optional(),
  enganche: z.string().optional(),
  pagoSemanal: z.string().optional(),
  especificaciones: z.record(z.string(), z.unknown()).optional(),
});

export class ProductController {
  // --- PÚBLICA ---
  async getPublicProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { marca, search, page, limit, sort, color, memoria, precioMin, precioMax } = req.query;
      const currentPage = page ? parseInt(page as string) : 1;
      const currentLimit = limit ? parseInt(limit as string) : 12;
      const result = await productService.getPublicProducts({
        marca: marca as string | string[],
        search: search as string,
        color: color as string,
        memoria: memoria as string,
        precioMin: precioMin ? parseFloat(precioMin as string) : undefined,
        precioMax: precioMax ? parseFloat(precioMax as string) : undefined,
        page: currentPage,
        limit: currentLimit,
        sort: sort as ProductSort,
      });
      sendPaginated(res, result.data, result.total, currentPage, currentLimit);
    } catch (err) {
      next(err);
    }
  }

  async getPublicProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getPublicProductById(req.params['id'] as string);
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  async getMarcas(req: Request, res: Response, next: NextFunction) {
    try {
      const marcas = await productService.getMarcas();
      sendSuccess(res, marcas);
    } catch (err) {
      next(err);
    }
  }

  async getColores(req: Request, res: Response, next: NextFunction) {
    try {
      const colores = await productService.getColores();
      sendSuccess(res, colores);
    } catch (err) {
      next(err);
    }
  }

  async getMemorias(req: Request, res: Response, next: NextFunction) {
    try {
      const memorias = await productService.getMemorias();
      sendSuccess(res, memorias);
    } catch (err) {
      next(err);
    }
  }

  async getPopulares(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getPopulares(6);
      sendSuccess(res, products);
    } catch (err) {
      next(err);
    }
  }

  async getEnOferta(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getEnOferta(6);
      sendSuccess(res, products);
    } catch (err) {
      next(err);
    }
  }

  // --- ADMIN ---
  async getAdminProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { marca, isActive, search, page, limit, sort } = req.query;
      const currentPage = page ? parseInt(page as string) : 1;
      const currentLimit = limit ? parseInt(limit as string) : 20;
      const result = await productService.getAdminProducts({
        marca: marca as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search as string,
        page: currentPage,
        limit: currentLimit,
        sort: sort as ProductSort,
      });
      sendPaginated(res, result.data, result.total, currentPage, currentLimit);
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    // El upload se maneja antes de llegar aquí via middleware en la ruta
    try {
      const body = { ...req.body };
      // Convertir tipos que vienen como string desde FormData
      if (body.precio) body.precio = parseFloat(body.precio);
      if (body.precioAnterior) body.precioAnterior = parseFloat(body.precioAnterior);
      if (body.stock !== undefined) body.stock = parseInt(body.stock);
      if (body.stockMinimo !== undefined) body.stockMinimo = parseInt(body.stockMinimo);
      // pagosSemanales ahora es string, no necesita conversión
      if (body.disponibleCredito !== undefined) body.disponibleCredito = body.disponibleCredito === 'true' || body.disponibleCredito === true;
      if (body.especificaciones && typeof body.especificaciones === 'string') {
        try { body.especificaciones = JSON.parse(body.especificaciones); } catch { delete body.especificaciones; }
      }
      // colores: puede venir como JSON string o como múltiples campos
      let colores: string[] = [];
      if (body.colores) {
        if (typeof body.colores === 'string') {
          try { colores = JSON.parse(body.colores); } catch { colores = body.colores.split(',').map((c: string) => c.trim()).filter(Boolean); }
        } else if (Array.isArray(body.colores)) {
          colores = body.colores;
        }
      }
      // memorias: igual que colores
      let memorias: string[] = [];
      if (body.memorias) {
        if (typeof body.memorias === 'string') {
          try { memorias = JSON.parse(body.memorias); } catch { memorias = body.memorias.split(',').map((c: string) => c.trim()).filter(Boolean); }
        } else if (Array.isArray(body.memorias)) {
          memorias = body.memorias;
        }
      }
      // imagenesColores: mapeo de cada imagen a su color
      let imagenesColores: string[] = [];
      if (body.imagenesColores) {
        if (typeof body.imagenesColores === 'string') {
          try { imagenesColores = JSON.parse(body.imagenesColores); } catch { imagenesColores = body.imagenesColores.split(',').map((c: string) => c.trim()).filter(Boolean); }
        } else if (Array.isArray(body.imagenesColores)) {
          imagenesColores = body.imagenesColores;
        }
      }

      // Reemplazar los campos en el body con los arrays parseados
      // Si el array está vacío, dejarlo como undefined para que la validación funcione correctamente
      if (body.colores !== undefined) {
        body.colores = colores.length > 0 ? colores : undefined;
      }
      if (body.memorias !== undefined) {
        body.memorias = memorias.length > 0 ? memorias : undefined;
      }
      if (body.imagenesColores !== undefined) {
        body.imagenesColores = imagenesColores.length > 0 ? imagenesColores : undefined;
      }

      const data = createProductSchema.parse(body);

      // Subir imágenes a Cloudinary en paralelo (o guardar local como fallback)
      const files = req.files as Express.Multer.File[] | undefined;
      let imagenes: string[] = [];
      if (files && files.length > 0) {
        imagenes = await Promise.all(
          files.map(file => uploadToCloudinary(file.path, 'productos'))
        );
      }

      const product = await productService.createProduct({ ...data, imagenes, colores, memorias, imagenesColores });
      sendSuccess(res, product, 'Producto creado exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const body = { ...req.body };
      if (body.precio) body.precio = parseFloat(body.precio);
      if (body.precioAnterior !== undefined) {
        body.precioAnterior = (body.precioAnterior === '' || body.precioAnterior === null)
          ? null
          : parseFloat(body.precioAnterior);
      }
      if (body.stock !== undefined) body.stock = parseInt(body.stock);
      if (body.stockMinimo !== undefined) body.stockMinimo = parseInt(body.stockMinimo);
      // pagosSemanales ahora es string, no necesita conversión
      if (body.disponibleCredito !== undefined) body.disponibleCredito = body.disponibleCredito === 'true' || body.disponibleCredito === true;
      if (body.especificaciones && typeof body.especificaciones === 'string') {
        try { body.especificaciones = JSON.parse(body.especificaciones); } catch { delete body.especificaciones; }
      }
      let colores: string[] | undefined;
      if (body.colores !== undefined) {
        if (typeof body.colores === 'string') {
          try { colores = JSON.parse(body.colores); } catch { colores = body.colores.split(',').map((c: string) => c.trim()).filter(Boolean); }
        } else if (Array.isArray(body.colores)) {
          colores = body.colores;
        }
        // Si el array está vacío, dejarlo como undefined
        body.colores = (colores && colores.length > 0) ? colores : undefined;
      }
      let memorias: string[] | undefined;
      if (body.memorias !== undefined) {
        if (typeof body.memorias === 'string') {
          try { memorias = JSON.parse(body.memorias); } catch { memorias = body.memorias.split(',').map((c: string) => c.trim()).filter(Boolean); }
        } else if (Array.isArray(body.memorias)) {
          memorias = body.memorias;
        }
        // Si el array está vacío, dejarlo como undefined
        body.memorias = (memorias && memorias.length > 0) ? memorias : undefined;
      }
      let imagenesColores: string[] | undefined;
      if (body.imagenesColores !== undefined) {
        if (typeof body.imagenesColores === 'string') {
          try { imagenesColores = JSON.parse(body.imagenesColores); } catch { imagenesColores = body.imagenesColores.split(',').map((c: string) => c.trim()).filter(Boolean); }
        } else if (Array.isArray(body.imagenesColores)) {
          imagenesColores = body.imagenesColores;
        }
        // Si el array está vacío, dejarlo como undefined
        body.imagenesColores = (imagenesColores && imagenesColores.length > 0) ? imagenesColores : undefined;
      }

      const data = createProductSchema.partial().parse(body);

      // Imágenes: combinar existentes que no se quitaron + nuevas subidas
      const files = req.files as Express.Multer.File[] | undefined;

      // URLs existentes que el admin decidió conservar (puede ser array, string, o vacío)
      let imagenesExistentes: string[] = [];
      if (body.imagenesExistentes) {
        if (typeof body.imagenesExistentes === 'string') {
          // Puede venir como JSON string "[]" o como una URL individual
          try {
            const parsed = JSON.parse(body.imagenesExistentes);
            imagenesExistentes = Array.isArray(parsed) ? parsed : [];
          } catch {
            // No es JSON, es una URL individual
            imagenesExistentes = [body.imagenesExistentes];
          }
        } else if (Array.isArray(body.imagenesExistentes)) {
          imagenesExistentes = body.imagenesExistentes;
        }
      }

      // Nuevas imágenes subidas a Cloudinary en paralelo (o local como fallback)
      let nuevasImagenes: string[] = [];
      if (files && files.length > 0) {
        nuevasImagenes = await Promise.all(
          files.map(file => uploadToCloudinary(file.path, 'productos'))
        );
      }

      // Imágenes finales = existentes conservadas + nuevas
      const imagenes: string[] = [...imagenesExistentes, ...nuevasImagenes];

      // Eliminar las imágenes que el admin quitó en paralelo
      const existing = await productService.getAdminProductById(req.params['id'] as string);
      if (existing.imagenes && Array.isArray(existing.imagenes)) {
        const toDelete = (existing.imagenes as string[]).filter(
          imgPath => !imagenesExistentes.includes(imgPath)
        );
        if (toDelete.length > 0) {
          await Promise.all(toDelete.map(imgPath => deleteFromCloudinary(imgPath)));
        }
      }

      const product = await productService.updateProduct(
        req.params['id'] as string,
        {
          ...data,
          imagenes,
          ...(colores !== undefined ? { colores } : {}),
          ...(memorias !== undefined ? { memorias } : {}),
          ...(imagenesColores !== undefined ? { imagenesColores } : {}),
        }
      );
      sendSuccess(res, product, 'Producto actualizado');
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.toggleProductStatus(req.params['id'] as string);
      sendSuccess(res, product, `Producto ${product.isActive ? 'activado' : 'desactivado'}`);
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteProduct(req.params['id'] as string);
      sendSuccess(res, null, 'Producto eliminado');
    } catch (err) {
      next(err);
    }
  }

  // Middleware de upload (se usa directamente en las rutas)
  uploadMiddleware(req: Request, res: Response, next: NextFunction) {
    uploadProductImages(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next();
    });
  }
}

export const productController = new ProductController();
