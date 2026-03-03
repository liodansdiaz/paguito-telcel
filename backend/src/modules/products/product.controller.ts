import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { productService } from './product.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.helper';
import type { ProductSort } from './product.repository';
import { uploadProductImages } from '../../shared/middleware/upload.middleware';
import path from 'path';
import fs from 'fs';

const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  nombre: z.string().min(1, 'Nombre requerida'),
  marca: z.string().min(1, 'Marca requerida'),
  descripcion: z.string().optional(),
  precio: z.number().positive('Precio debe ser positivo'),
  precioAnterior: z.number().positive().optional(),
  stock: z.number().int().min(0),
  stockMinimo: z.number().int().min(0).optional(),
  badge: z.string().optional(),
  disponibleCredito: z.boolean().optional(),
  pagosSemanales: z.number().positive().optional(),
  especificaciones: z.record(z.string(), z.unknown()).optional(),
});

export class ProductController {
  // --- PÚBLICA ---
  async getPublicProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { marca, search, page, limit, sort } = req.query;
      const currentPage = page ? parseInt(page as string) : 1;
      const currentLimit = limit ? parseInt(limit as string) : 12;
      const result = await productService.getPublicProducts({
        marca: marca as string,
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
      if (body.pagosSemanales) body.pagosSemanales = parseFloat(body.pagosSemanales);
      if (body.disponibleCredito !== undefined) body.disponibleCredito = body.disponibleCredito === 'true' || body.disponibleCredito === true;
      if (body.especificaciones && typeof body.especificaciones === 'string') {
        try { body.especificaciones = JSON.parse(body.especificaciones); } catch { delete body.especificaciones; }
      }

      const data = createProductSchema.parse(body);

      // Rutas de las imágenes subidas
      const files = req.files as Express.Multer.File[] | undefined;
      const imagenes = files ? files.map((f) => `/uploads/productos/${f.filename}`) : [];

      const product = await productService.createProduct({ ...data, imagenes });
      sendSuccess(res, product, 'Producto creado exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const body = { ...req.body };
      if (body.precio) body.precio = parseFloat(body.precio);
      if (body.precioAnterior) body.precioAnterior = parseFloat(body.precioAnterior);
      if (body.stock !== undefined) body.stock = parseInt(body.stock);
      if (body.stockMinimo !== undefined) body.stockMinimo = parseInt(body.stockMinimo);
      if (body.pagosSemanales) body.pagosSemanales = parseFloat(body.pagosSemanales);
      if (body.disponibleCredito !== undefined) body.disponibleCredito = body.disponibleCredito === 'true' || body.disponibleCredito === true;
      if (body.especificaciones && typeof body.especificaciones === 'string') {
        try { body.especificaciones = JSON.parse(body.especificaciones); } catch { delete body.especificaciones; }
      }

      const data = createProductSchema.partial().parse(body);

      // Imágenes nuevas subidas
      const files = req.files as Express.Multer.File[] | undefined;
      let imagenes: string[] | undefined;

      if (files && files.length > 0) {
        // Si se suben nuevas imágenes, reemplazar las anteriores
        const existing = await productService.getAdminProductById(req.params['id'] as string);
        // Eliminar archivos viejos del disco
        if (existing.imagenes && Array.isArray(existing.imagenes)) {
          for (const imgPath of existing.imagenes as string[]) {
            const fullPath = path.join(process.cwd(), imgPath);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
          }
        }
        imagenes = files.map((f) => `/uploads/productos/${f.filename}`);
      } else if (body.imagenesExistentes) {
        // El cliente puede pasar las URLs actuales para mantenerlas
        imagenes = Array.isArray(body.imagenesExistentes)
          ? body.imagenesExistentes
          : [body.imagenesExistentes];
      }

      const product = await productService.updateProduct(
        req.params['id'] as string,
        imagenes !== undefined ? { ...data, imagenes } : data
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
