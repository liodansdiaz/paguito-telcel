import { getRedisClient } from '../../config/redis';
import { logger } from '../utils/logger';

/**
 * Opciones de configuración para operaciones de caché
 */
interface CacheOptions {
  /** Tiempo de vida en segundos (por defecto: 300 = 5 minutos) */
  ttl?: number;
  /** Prefijo personalizado para la key */
  prefix?: string;
}

/**
 * Métricas de caché para monitoreo
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Servicio genérico de caché con Redis
 * 
 * Features:
 * - Get/Set con TTL configurable
 * - Invalidación de caché (individual o por patrón)
 * - Métricas de hit/miss ratio
 * - Graceful degradation (funciona sin Redis)
 * - Serialización automática de objetos
 */
export class CacheService {
  private static metrics = { hits: 0, misses: 0 };
  private static readonly DEFAULT_TTL = 300; // 5 minutos
  private static readonly DEFAULT_PREFIX = 'paguito';

  /**
   * Genera una key de caché con prefijo
   */
  private static generateKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || this.DEFAULT_PREFIX;
    return `${finalPrefix}:${key}`;
  }

  /**
   * Obtiene un valor del caché
   * 
   * @param key - Identificador único del dato
   * @param options - Opciones de configuración
   * @returns El valor cacheado o null si no existe
   */
  static async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) {
      logger.debug('Redis no disponible, skip cache get');
      return null;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const cached = await redis.get(cacheKey);

      if (cached) {
        this.metrics.hits++;
        logger.debug(`✅ Cache HIT: ${cacheKey}`);
        return JSON.parse(cached) as T;
      }

      this.metrics.misses++;
      logger.debug(`❌ Cache MISS: ${cacheKey}`);
      return null;
    } catch (error) {
      logger.error('Error al obtener del caché', { key, error });
      return null;
    }
  }

  /**
   * Guarda un valor en el caché
   * 
   * @param key - Identificador único del dato
   * @param value - Valor a cachear (será serializado a JSON)
   * @param options - Opciones de configuración (TTL, prefix)
   */
  static async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) {
      logger.debug('Redis no disponible, skip cache set');
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const ttl = options.ttl || this.DEFAULT_TTL;
      const serialized = JSON.stringify(value);

      await redis.setex(cacheKey, ttl, serialized);
      logger.debug(`💾 Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Error al guardar en caché', { key, error });
      return false;
    }
  }

  /**
   * Elimina un valor específico del caché
   * 
   * @param key - Identificador único del dato
   * @param options - Opciones de configuración
   */
  static async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await redis.del(cacheKey);
      logger.debug(`🗑️ Cache DELETE: ${cacheKey}`);
      return result > 0;
    } catch (error) {
      logger.error('Error al eliminar del caché', { key, error });
      return false;
    }
  }

  /**
   * Elimina múltiples keys que coincidan con un patrón
   * Útil para invalidar un grupo de keys relacionadas
   * 
   * Ejemplos:
   * - deletePattern('products:*') → Elimina todos los productos
   * - deletePattern('products:marca:Samsung:*') → Elimina productos de Samsung
   * 
   * @param pattern - Patrón de búsqueda (usar * como wildcard)
   * @param options - Opciones de configuración
   */
  static async deletePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const redis = getRedisClient();
    if (!redis) return 0;

    try {
      const fullPattern = this.generateKey(pattern, options.prefix);
      const keys = await redis.keys(fullPattern);

      if (keys.length === 0) {
        logger.debug(`🔍 Cache DELETE PATTERN: No keys found for ${fullPattern}`);
        return 0;
      }

      const result = await redis.del(...keys);
      logger.debug(`🗑️ Cache DELETE PATTERN: ${result} keys deleted for ${fullPattern}`);
      return result;
    } catch (error) {
      logger.error('Error al eliminar patrón del caché', { pattern, error });
      return 0;
    }
  }

  /**
   * Limpia TODO el caché (usar con precaución)
   */
  static async flush(): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      await redis.flushdb();
      logger.warn('🧹 Cache FLUSH: Toda la caché fue limpiada');
      return true;
    } catch (error) {
      logger.error('Error al limpiar caché', { error });
      return false;
    }
  }

  /**
   * Wrapper que obtiene del caché o ejecuta la función si no existe
   * Patrón "cache-aside" / "lazy loading"
   * 
   * @param key - Identificador único
   * @param fetchFn - Función para obtener los datos si no están en caché
   * @param options - Opciones de caché
   * @returns Los datos (desde caché o recién obtenidos)
   * 
   * @example
   * const products = await CacheService.getOrSet(
   *   'products:all',
   *   () => prisma.product.findMany(),
   *   { ttl: 600 }
   * );
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, ejecutar función y guardar resultado
    const data = await fetchFn();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Obtiene las métricas de uso del caché
   */
  static getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: parseFloat(hitRate.toFixed(2)),
    };
  }

  /**
   * Resetea las métricas de caché
   */
  static resetMetrics(): void {
    this.metrics = { hits: 0, misses: 0 };
    logger.debug('📊 Cache metrics reset');
  }

  /**
   * Obtiene información del servidor Redis
   */
  static async getInfo(): Promise<Record<string, any> | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
      const info = await redis.info();
      const lines = info.split('\r\n');
      const result: Record<string, any> = {};

      lines.forEach((line) => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            result[key] = value;
          }
        }
      });

      return result;
    } catch (error) {
      logger.error('Error al obtener info de Redis', { error });
      return null;
    }
  }

  /**
   * Verifica si una key existe en caché
   */
  static async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Error al verificar existencia en caché', { key, error });
      return false;
    }
  }

  /**
   * Obtiene el tiempo de vida restante de una key (en segundos)
   */
  static async getTTL(key: string, options: CacheOptions = {}): Promise<number> {
    const redis = getRedisClient();
    if (!redis) return -1;

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      return await redis.ttl(cacheKey);
    } catch (error) {
      logger.error('Error al obtener TTL', { key, error });
      return -1;
    }
  }
}

export default CacheService;
