import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────────

const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  flushdb: vi.fn(),
  exists: vi.fn(),
  ttl: vi.fn(),
  info: vi.fn(),
};

vi.mock('../config/redis', () => ({
  getRedisClient: vi.fn(() => mockRedis),
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
import { CacheService } from '../shared/services/cache.service';
import { getRedisClient } from '../config/redis';

// ───────────────────────────────────────────────────────────────────────────────────

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CacheService.resetMetrics();
    vi.mocked(getRedisClient).mockReturnValue(mockRedis as any);
  });

  // ── get ───────────────────────────────────────────────────────────────────────
  describe('get', () => {
    it('devuelve null si Redis no está disponible', async () => {
      vi.mocked(getRedisClient).mockReturnValue(null);

      const result = await CacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('devuelve valor cacheado (cache hit)', async () => {
      const cachedValue = { nombre: 'Producto' };
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(cachedValue));

      const result = await CacheService.get<{ nombre: string }>('test-key');

      expect(result).toEqual(cachedValue);
      expect(mockRedis.get).toHaveBeenCalledWith('paguito:test-key');

      const metrics = CacheService.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
    });

    it('devuelve null si no existe (cache miss)', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);

      const result = await CacheService.get('test-key');

      expect(result).toBeNull();

      const metrics = CacheService.getMetrics();
      expect(metrics.misses).toBe(1);
    });
  });

  // ── set ───────────────────────────────────────────────────────────────────────
  describe('set', () => {
    it('guarda valor en caché', async () => {
      vi.mocked(mockRedis.setex).mockResolvedValue('OK');

      const value = { nombre: 'Producto' };
      const result = await CacheService.set('test-key', value);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'paguito:test-key',
        300,
        JSON.stringify(value)
      );
    });

    it('devuelve false si Redis no está disponible', async () => {
      vi.mocked(getRedisClient).mockReturnValue(null);

      const result = await CacheService.set('test-key', { data: 1 });

      expect(result).toBe(false);
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('elimina key existente', async () => {
      vi.mocked(mockRedis.del).mockResolvedValue(1);

      const result = await CacheService.delete('test-key');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('paguito:test-key');
    });

    it('devuelve false si Redis no está disponible', async () => {
      vi.mocked(getRedisClient).mockReturnValue(null);

      const result = await CacheService.delete('test-key');

      expect(result).toBe(false);
    });
  });

  // ── deletePattern ─────────────────────────────────────────────────────────────
  describe('deletePattern', () => {
    it('elimina múltiples keys', async () => {
      vi.mocked(mockRedis.keys).mockResolvedValue([
        'paguito:products:list:1',
        'paguito:products:list:2',
      ]);
      vi.mocked(mockRedis.del).mockResolvedValue(2);

      const result = await CacheService.deletePattern('products:*');

      expect(result).toBe(2);
      expect(mockRedis.keys).toHaveBeenCalledWith('paguito:products:*');
      expect(mockRedis.del).toHaveBeenCalledWith(
        'paguito:products:list:1',
        'paguito:products:list:2'
      );
    });

    it('devuelve 0 si no hay keys', async () => {
      vi.mocked(mockRedis.keys).mockResolvedValue([]);

      const result = await CacheService.deletePattern('products:*');

      expect(result).toBe(0);
    });
  });

  // ── flush ─────────────────────────────────────────────────────────────────────
  describe('flush', () => {
    it('limpia toda la caché', async () => {
      vi.mocked(mockRedis.flushdb).mockResolvedValue('OK');

      const result = await CacheService.flush();

      expect(result).toBe(true);
      expect(mockRedis.flushdb).toHaveBeenCalledOnce();
    });
  });

  // ── getOrSet ──────────────────────────────────────────────────────────────────
  describe('getOrSet', () => {
    it('devuelve valor cacheado si existe', async () => {
      const cachedValue = [{ id: 1 }];
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(cachedValue));

      const fetchFn = vi.fn();
      const result = await CacheService.getOrSet('test-key', fetchFn);

      expect(result).toEqual(cachedValue);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('ejecuta fetchFn y guarda si no existe', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(mockRedis.setex).mockResolvedValue('OK');

      const freshData = [{ id: 1, nombre: 'Nuevo' }];
      const fetchFn = vi.fn().mockResolvedValue(freshData);

      const result = await CacheService.getOrSet('test-key', fetchFn, { ttl: 120 });

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalledOnce();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'paguito:test-key',
        120,
        JSON.stringify(freshData)
      );
    });
  });

  // ── getMetrics ────────────────────────────────────────────────────────────────
  describe('getMetrics', () => {
    it('calcula hit rate correctamente', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify('valor'));
      await CacheService.get('key1');
      await CacheService.get('key2');
      await CacheService.get('key3');

      vi.mocked(mockRedis.get).mockResolvedValue(null);
      await CacheService.get('key4');

      const metrics = CacheService.getMetrics();

      expect(metrics.hits).toBe(3);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(75);
    });
  });

  // ── resetMetrics ──────────────────────────────────────────────────────────────
  describe('resetMetrics', () => {
    it('resetea métricas a cero', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify('valor'));
      await CacheService.get('key1');

      CacheService.resetMetrics();

      const metrics = CacheService.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(0);
    });
  });

  // ── exists ────────────────────────────────────────────────────────────────────
  describe('exists', () => {
    it('devuelve true si key existe', async () => {
      vi.mocked(mockRedis.exists).mockResolvedValue(1);

      const result = await CacheService.exists('test-key');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('paguito:test-key');
    });

    it('devuelve false si key no existe', async () => {
      vi.mocked(mockRedis.exists).mockResolvedValue(0);

      const result = await CacheService.exists('test-key');

      expect(result).toBe(false);
    });
  });

  // ── getTTL ────────────────────────────────────────────────────────────────────
  describe('getTTL', () => {
    it('devuelve TTL de una key', async () => {
      vi.mocked(mockRedis.ttl).mockResolvedValue(245);

      const result = await CacheService.getTTL('test-key');

      expect(result).toBe(245);
      expect(mockRedis.ttl).toHaveBeenCalledWith('paguito:test-key');
    });
  });
});
