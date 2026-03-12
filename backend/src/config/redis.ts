import Redis from 'ioredis';
import { logger } from '../shared/utils/logger';

// Configuración de Redis con reconnect automático
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((targetError) => err.message.includes(targetError));
  },
};

// Cliente Redis singleton
let redisClient: Redis | null = null;

/**
 * Obtiene la instancia de Redis (singleton)
 * Si Redis no está disponible, retorna null y la app funciona sin caché
 */
export const getRedisClient = (): Redis | null => {
  // Si Redis está deshabilitado en variables de entorno
  if (process.env.REDIS_ENABLED === 'false') {
    return null;
  }

  // Si ya existe una instancia, retornarla
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      logger.info('✅ Redis: Conectado exitosamente');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis: Listo para recibir comandos');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis: Error de conexión', { error: err.message });
    });

    redisClient.on('reconnecting', () => {
      logger.warn('⚠️ Redis: Intentando reconectar...');
    });

    redisClient.on('close', () => {
      logger.warn('⚠️ Redis: Conexión cerrada');
    });

    return redisClient;
  } catch (error) {
    logger.error('❌ Redis: Error al inicializar cliente', { error });
    return null;
  }
};

/**
 * Cierra la conexión de Redis (para testing o shutdown)
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('✅ Redis: Conexión cerrada correctamente');
  }
};

/**
 * Verifica si Redis está disponible y funcionando
 */
export const isRedisAvailable = async (): Promise<boolean> => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const response = await client.ping();
    return response === 'PONG';
  } catch (error) {
    return false;
  }
};

// Exportar cliente por defecto
export default getRedisClient;
