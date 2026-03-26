import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────────

vi.mock('../modules/products/product.repository', () => ({
  productRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleActive: vi.fn(),
    delete: vi.fn(),
    getMarcas: vi.fn(),
    getColores: vi.fn(),
    getMemorias: vi.fn(),
    findPopulares: vi.fn(),
    findEnOferta: vi.fn(),
  },
}));

vi.mock('../shared/services/cache.service', () => ({
  CacheService: {
    getOrSet: vi.fn(),
    deletePattern: vi.fn(),
  },
}));

vi.mock('../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Imports post-mock ─────────────────────────────────────────────────────────────
import { ProductService } from '../modules/products/product.service';
import { productRepository } from '../modules/products/product.repository';
import { CacheService } from '../shared/services/cache.service';

// ── Datos de prueba ───────────────────────────────────────────────────────────────

const mockProduct = {
  id: 'prod-001',
  sku: 'SKU001',
  nombre: 'Samsung Galaxy S24',
  marca: 'Samsung',
  descripcion: 'Celular de alta gama',
  precio: 14999,
  precioAnterior: 17999,
  stock: 10,
  stockMinimo: 5,
  imagenes: ['img1.jpg'],
  colores: ['Negro', 'Blanco'],
  memorias: ['128GB', '256GB'],
  badge: 'Nuevo',
  disponibleCredito: true,
  enganche: '2000',
  pagoSemanal: '350',
  especificaciones: { pantalla: '6.2"' },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProductsList = { data: [mockProduct], total: 1 };

// ───────────────────────────────────────────────────────────────────────────────────

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductService();
  });

  // ── getPublicProducts ──────────────────────────────────────────────────────────
  describe('getPublicProducts', () => {
    it('devuelve productos cacheados', async () => {
      vi.mocked(CacheService.getOrSet).mockResolvedValue(mockProductsList);

      const result = await service.getPublicProducts({ page: 1, limit: 20 });

      expect(result).toEqual(mockProductsList);
      expect(CacheService.getOrSet).toHaveBeenCalledOnce();
    });
  });

  // ── getPublicProductById ──────────────────────────────────────────────────────
  describe('getPublicProductById', () => {
    it('devuelve producto activo', async () => {
      vi.mocked(CacheService.getOrSet).mockResolvedValue(mockProduct);

      const result = await service.getPublicProductById('prod-001');

      expect(result).toEqual(mockProduct);
    });

    it('lanza 404 si producto no existe', async () => {
      vi.mocked(CacheService.getOrSet).mockResolvedValue(null);

      await expect(service.getPublicProductById('inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza 404 si producto está inactivo', async () => {
      vi.mocked(CacheService.getOrSet).mockResolvedValue({ ...mockProduct, isActive: false });

      await expect(service.getPublicProductById('prod-001'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── getAdminProducts ──────────────────────────────────────────────────────────
  describe('getAdminProducts', () => {
    it('devuelve todos los productos', async () => {
      vi.mocked(productRepository.findAll).mockResolvedValue(mockProductsList as any);

      const result = await service.getAdminProducts({ page: 1, limit: 20 });

      expect(result).toEqual(mockProductsList);
      expect(productRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  // ── getAdminProductById ──────────────────────────────────────────────────────
  describe('getAdminProductById', () => {
    it('devuelve producto', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);

      const result = await service.getAdminProductById('prod-001');

      expect(result).toEqual(mockProduct);
      expect(productRepository.findById).toHaveBeenCalledWith('prod-001');
    });

    it('lanza 404 si no existe', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(service.getAdminProductById('inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── createProduct ─────────────────────────────────────────────────────────────
  describe('createProduct', () => {
    it('crea producto e invalida caché', async () => {
      vi.mocked(productRepository.create).mockResolvedValue(mockProduct as any);
      vi.mocked(CacheService.deletePattern).mockResolvedValue(0);

      const result = await service.createProduct({
        sku: 'SKU001',
        nombre: 'Samsung Galaxy S24',
        marca: 'Samsung',
        precio: 14999,
        stock: 10,
      });

      expect(result).toEqual(mockProduct);
      expect(productRepository.create).toHaveBeenCalledOnce();
      expect(CacheService.deletePattern).toHaveBeenCalledWith('*', { prefix: 'products' });
    });
  });

  // ── updateProduct ─────────────────────────────────────────────────────────────
  describe('updateProduct', () => {
    it('actualiza producto e invalida caché', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
      vi.mocked(productRepository.update).mockResolvedValue({ ...mockProduct, nombre: 'Actualizado' } as any);
      vi.mocked(CacheService.deletePattern).mockResolvedValue(0);

      const result = await service.updateProduct('prod-001', { nombre: 'Actualizado' });

      expect(result.nombre).toBe('Actualizado');
      expect(productRepository.update).toHaveBeenCalledWith('prod-001', { nombre: 'Actualizado' });
      expect(CacheService.deletePattern).toHaveBeenCalledWith('*', { prefix: 'products' });
    });

    it('lanza 404 si no existe', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(service.updateProduct('inexistente', { nombre: 'X' }))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── toggleProductStatus ──────────────────────────────────────────────────────
  describe('toggleProductStatus', () => {
    it('cambia estado e invalida caché', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
      vi.mocked(productRepository.toggleActive).mockResolvedValue({ ...mockProduct, isActive: false } as any);
      vi.mocked(CacheService.deletePattern).mockResolvedValue(0);

      const result = await service.toggleProductStatus('prod-001');

      expect(result.isActive).toBe(false);
      expect(productRepository.toggleActive).toHaveBeenCalledWith('prod-001');
      expect(CacheService.deletePattern).toHaveBeenCalledWith('*', { prefix: 'products' });
    });
  });

  // ── deleteProduct ─────────────────────────────────────────────────────────────
  describe('deleteProduct', () => {
    it('elimina producto e invalida caché', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
      vi.mocked(productRepository.delete).mockResolvedValue(mockProduct as any);
      vi.mocked(CacheService.deletePattern).mockResolvedValue(0);

      const result = await service.deleteProduct('prod-001');

      expect(result).toEqual(mockProduct);
      expect(productRepository.delete).toHaveBeenCalledWith('prod-001');
      expect(CacheService.deletePattern).toHaveBeenCalledWith('*', { prefix: 'products' });
    });
  });

  // ── getMarcas ─────────────────────────────────────────────────────────────────
  describe('getMarcas', () => {
    it('devuelve marcas cacheadas', async () => {
      const marcas = ['Apple', 'Samsung', 'Xiaomi'];
      vi.mocked(CacheService.getOrSet).mockResolvedValue(marcas);

      const result = await service.getMarcas();

      expect(result).toEqual(marcas);
      expect(CacheService.getOrSet).toHaveBeenCalledOnce();
    });
  });

  // ── getColores ────────────────────────────────────────────────────────────────
  describe('getColores', () => {
    it('devuelve colores cacheados', async () => {
      const colores = ['Blanco', 'Negro', 'Rojo'];
      vi.mocked(CacheService.getOrSet).mockResolvedValue(colores);

      const result = await service.getColores();

      expect(result).toEqual(colores);
      expect(CacheService.getOrSet).toHaveBeenCalledOnce();
    });
  });

  // ── getMemorias ──────────────────────────────────────────────────────────────
  describe('getMemorias', () => {
    it('devuelve memorias cacheadas', async () => {
      const memorias = ['64GB', '128GB', '256GB'];
      vi.mocked(CacheService.getOrSet).mockResolvedValue(memorias);

      const result = await service.getMemorias();

      expect(result).toEqual(memorias);
      expect(CacheService.getOrSet).toHaveBeenCalledOnce();
    });
  });

  // ── getPopulares ─────────────────────────────────────────────────────────────
  describe('getPopulares', () => {
    it('devuelve productos populares', async () => {
      vi.mocked(CacheService.getOrSet).mockResolvedValue([mockProduct]);

      const result = await service.getPopulares(6);

      expect(result).toEqual([mockProduct]);
      expect(CacheService.getOrSet).toHaveBeenCalledOnce();
    });
  });

  // ── getEnOferta ──────────────────────────────────────────────────────────────
  describe('getEnOferta', () => {
    it('devuelve productos en oferta', async () => {
      vi.mocked(CacheService.getOrSet).mockResolvedValue([mockProduct]);

      const result = await service.getEnOferta(6);

      expect(result).toEqual([mockProduct]);
      expect(CacheService.getOrSet).toHaveBeenCalledOnce();
    });
  });
});
