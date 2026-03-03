import { productRepository, ProductFilters } from './product.repository';
import { AppError } from '../../shared/middleware/error.middleware';
import { Prisma } from '@prisma/client';

export class ProductService {
  async getPublicProducts(filters: ProductFilters) {
    return productRepository.findAll({ ...filters, isActive: true });
  }

  async getPublicProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product || !product.isActive) {
      throw new AppError('Producto no encontrado.', 404);
    }
    return product;
  }

  async getAdminProducts(filters: ProductFilters) {
    return productRepository.findAll(filters);
  }

  async getAdminProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Producto no encontrado.', 404);
    return product;
  }

  async createProduct(data: {
    sku: string;
    nombre: string;
    marca: string;
    descripcion?: string;
    precio: number;
    precioAnterior?: number;
    stock: number;
    stockMinimo?: number;
    imagenes?: string[];
    badge?: string;
    disponibleCredito?: boolean;
    pagosSemanales?: number;
    especificaciones?: Record<string, unknown>;
  }) {
    const createData: Prisma.ProductCreateInput = {
      sku: data.sku,
      nombre: data.nombre,
      marca: data.marca,
      descripcion: data.descripcion,
      precio: data.precio,
      precioAnterior: data.precioAnterior,
      stock: data.stock,
      stockMinimo: data.stockMinimo || 5,
      imagenes: data.imagenes ?? [],
      badge: data.badge,
      disponibleCredito: data.disponibleCredito ?? true,
      pagosSemanales: data.pagosSemanales,
      especificaciones: data.especificaciones as Prisma.InputJsonValue,
    };
    return productRepository.create(createData);
  }

  async updateProduct(id: string, data: Partial<{
    nombre: string;
    marca: string;
    descripcion: string;
    precio: number;
    precioAnterior: number;
    stock: number;
    stockMinimo: number;
    imagenes: string[];
    badge: string;
    disponibleCredito: boolean;
    pagosSemanales: number;
    especificaciones: Record<string, unknown>;
    isActive: boolean;
  }>) {
    await this.getAdminProductById(id);
    return productRepository.update(id, data as Prisma.ProductUpdateInput);
  }

  async toggleProductStatus(id: string) {
    await this.getAdminProductById(id);
    return productRepository.toggleActive(id);
  }

  async deleteProduct(id: string) {
    await this.getAdminProductById(id);
    return productRepository.delete(id);
  }

  async getMarcas() {
    return productRepository.getMarcas();
  }

  async getPopulares(limit = 6) {
    return productRepository.findPopulares(limit);
  }

  async getEnOferta(limit = 6) {
    return productRepository.findEnOferta(limit);
  }
}

export const productService = new ProductService();
