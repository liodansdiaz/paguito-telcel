import { productRepository, ProductFilters } from './product.repository';
import { AppError } from '../../shared/middleware/error.middleware';
import { Prisma } from '@prisma/client';
import { CacheService } from '../../shared/services/cache.service';

export class ProductService {
  // TTL de caché: 10 minutos para productos (cambian poco)
  private readonly CACHE_TTL = 600;
  // Prefijo de caché para productos
  private readonly CACHE_PREFIX = 'products';

  /**
   * Genera una key de caché basada en filtros
   */
  private generateCacheKey(filters: any): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = filters[key];
        return acc;
      }, {} as any);
    return JSON.stringify(sortedFilters);
  }

  async getPublicProducts(filters: Omit<ProductFilters, 'isActive'>) {
    const cacheKey = `list:${this.generateCacheKey({ ...filters, isActive: true })}`;
    
    return CacheService.getOrSet(
      cacheKey,
      () => productRepository.findAll({ ...filters, isActive: true }),
      { ttl: this.CACHE_TTL, prefix: this.CACHE_PREFIX }
    );
  }

  async getPublicProductById(id: string) {
    const cacheKey = `public:${id}`;
    
    const product = await CacheService.getOrSet(
      cacheKey,
      () => productRepository.findById(id),
      { ttl: this.CACHE_TTL, prefix: this.CACHE_PREFIX }
    );

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

  /**
   * Invalida todo el caché de productos
   * Se ejecuta después de crear, actualizar o eliminar productos
   */
  private async invalidateCache(): Promise<void> {
    await CacheService.deletePattern('*', { prefix: this.CACHE_PREFIX });
  }

  async createProduct(data: {
    sku: string;
    nombre: string;
    marca: string;
    descripcion?: string;
    precio: number;
    precioAnterior?: number | null;
    stock: number;
    stockMinimo?: number;
    imagenes?: string[];
    colores?: string[];
    memorias?: string[];
    badge?: string;
    disponibleCredito?: boolean;
    pagosSemanales?: string;
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
      colores: data.colores ?? [],
      memorias: data.memorias ?? [],
      badge: data.badge,
      disponibleCredito: data.disponibleCredito ?? true,
      pagosSemanales: data.pagosSemanales,
      especificaciones: data.especificaciones as Prisma.InputJsonValue,
    };
    
    const product = await productRepository.create(createData);
    
    // Invalidar caché después de crear
    await this.invalidateCache();
    
    return product;
  }

  async updateProduct(id: string, data: Partial<{
    nombre: string;
    marca: string;
    descripcion: string;
    precio: number;
    precioAnterior: number | null;
    stock: number;
    stockMinimo: number;
    imagenes: string[];
    colores: string[];
    memorias: string[];
    badge: string;
    disponibleCredito: boolean;
    pagosSemanales: string;
    especificaciones: Record<string, unknown>;
    isActive: boolean;
  }>) {
    await this.getAdminProductById(id);
    const product = await productRepository.update(id, data as Prisma.ProductUpdateInput);
    
    // Invalidar caché después de actualizar
    await this.invalidateCache();
    
    return product;
  }

  async toggleProductStatus(id: string) {
    await this.getAdminProductById(id);
    const product = await productRepository.toggleActive(id);
    
    // Invalidar caché después de cambiar estado
    await this.invalidateCache();
    
    return product;
  }

  async deleteProduct(id: string) {
    await this.getAdminProductById(id);
    const product = await productRepository.delete(id);
    
    // Invalidar caché después de eliminar
    await this.invalidateCache();
    
    return product;
  }

  async getMarcas() {
    const cacheKey = 'marcas:all';
    
    return CacheService.getOrSet(
      cacheKey,
      () => productRepository.getMarcas(),
      { ttl: this.CACHE_TTL, prefix: this.CACHE_PREFIX }
    );
  }

  async getColores() {
    const cacheKey = 'colores:all';
    
    return CacheService.getOrSet(
      cacheKey,
      () => productRepository.getColores(),
      { ttl: this.CACHE_TTL, prefix: this.CACHE_PREFIX }
    );
  }

  async getMemorias() {
    const cacheKey = 'memorias:all';
    
    return CacheService.getOrSet(
      cacheKey,
      () => productRepository.getMemorias(),
      { ttl: this.CACHE_TTL, prefix: this.CACHE_PREFIX }
    );
  }

  async getPopulares(limit = 6) {
    const cacheKey = `populares:${limit}`;
    
    return CacheService.getOrSet(
      cacheKey,
      () => productRepository.findPopulares(limit),
      { ttl: this.CACHE_TTL, prefix: this.CACHE_PREFIX }
    );
  }

  async getEnOferta(limit = 6) {
    const cacheKey = `ofertas:${limit}`;
    
    return CacheService.getOrSet(
      cacheKey,
      () => productRepository.findEnOferta(limit),
      { ttl: this.CACHE_TTL, prefix: this.CACHE_PREFIX }
    );
  }
}

export const productService = new ProductService();
