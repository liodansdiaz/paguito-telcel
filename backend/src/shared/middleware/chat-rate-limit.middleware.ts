import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../../config/redis';
import { logger } from '../utils/logger';

/**
 * Chat Rate Limiting Middleware
 * 
 * Límites progresivos por sesión (fingerprint):
 * - Tier 1 (mensajes 1-5): Sin límite (experiencia fluida)
 * - Tier 2 (mensajes 6-20): Máximo 1 mensaje cada 10 segundos
 * - Tier 3 (mensajes 21-30): Máximo 1 mensaje cada 30 segundos
 * - Tier 4 (mensajes 31+): Bloqueado temporalmente (1 hora)
 */

interface RateLimitConfig {
  tier: number;
  maxMessages: number;
  cooldownSeconds: number;
  blockDuration?: number; // en segundos
}

const TIERS: RateLimitConfig[] = [
  { tier: 1, maxMessages: 5, cooldownSeconds: 0 }, // Sin cooldown
  { tier: 2, maxMessages: 20, cooldownSeconds: 10 },
  { tier: 3, maxMessages: 30, cooldownSeconds: 30 },
  { tier: 4, maxMessages: Infinity, cooldownSeconds: 0, blockDuration: 3600 }, // Bloqueo 1 hora
];

export async function chatRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const redis = getRedisClient();

  // Si Redis no está disponible, permitir el request (graceful degradation)
  if (!redis) {
    logger.warn('Redis no disponible, rate limiting deshabilitado');
    return next();
  }

  try {
    // Obtener fingerprint del header
    const fingerprint = req.headers['x-session-id'] as string;

    if (!fingerprint) {
      res.status(400).json({
        error: 'Falta identificador de sesión. Por favor recarga la página.',
        errorType: 'VALIDATION_ERROR',
        errorCode: 'MISSING_FINGERPRINT',
      });
      return;
    }

    const now = Date.now();
    const keyPrefix = `chat:ratelimit:${fingerprint}`;

    // Verificar si está bloqueado
    const blockedUntil = await redis.get(`${keyPrefix}:blocked`);
    if (blockedUntil) {
      const blockedUntilTime = parseInt(blockedUntil);
      if (now < blockedUntilTime) {
        const remainingSeconds = Math.ceil((blockedUntilTime - now) / 1000);
        res.status(429).json({
          error: `Demasiadas consultas. Por favor esperá ${Math.ceil(remainingSeconds / 60)} minutos antes de continuar.`,
          errorType: 'RATE_LIMIT_ERROR',
          errorCode: 'BLOCKED',
          retryAfter: remainingSeconds,
        });
        return;
      } else {
        // El bloqueo expiró, eliminar la key
        await redis.del(`${keyPrefix}:blocked`);
      }
    }

    // Obtener contador de mensajes en la última hora
    const countKey = `${keyPrefix}:count`;
    const count = await redis.get(countKey);
    const messageCount = count ? parseInt(count) : 0;

    // Determinar tier actual
    let currentTier = TIERS[0];
    for (const tier of TIERS) {
      if (messageCount < tier.maxMessages) {
        currentTier = tier;
        break;
      }
    }

    // Si llegó al tier 4, bloquear
    if (currentTier.tier === 4) {
      const blockedUntilTime = now + (currentTier.blockDuration! * 1000);
      await redis.setex(`${keyPrefix}:blocked`, currentTier.blockDuration!, blockedUntilTime.toString());
      
      logger.warn('Usuario bloqueado por exceso de requests', {
        fingerprint,
        messageCount,
        blockedUntil: new Date(blockedUntilTime).toISOString(),
      });

      res.status(429).json({
        error: 'Has excedido el límite de consultas. Por favor esperá 1 hora antes de continuar.',
        errorType: 'RATE_LIMIT_ERROR',
        errorCode: 'TOO_MANY_REQUESTS',
        retryAfter: currentTier.blockDuration,
      });
      return;
    }

    // Verificar cooldown si aplica
    if (currentTier.cooldownSeconds > 0) {
      const lastRequestKey = `${keyPrefix}:last`;
      const lastRequest = await redis.get(lastRequestKey);

      if (lastRequest) {
        const lastRequestTime = parseInt(lastRequest);
        const timeSinceLastRequest = (now - lastRequestTime) / 1000; // en segundos

        if (timeSinceLastRequest < currentTier.cooldownSeconds) {
          const remainingSeconds = Math.ceil(currentTier.cooldownSeconds - timeSinceLastRequest);
          res.status(429).json({
            error: `Por favor esperá ${remainingSeconds} segundos antes de enviar otro mensaje.`,
            errorType: 'RATE_LIMIT_ERROR',
            errorCode: 'COOLDOWN_ACTIVE',
            retryAfter: remainingSeconds,
            tier: currentTier.tier,
          });
          return;
        }
      }

      // Actualizar timestamp del último request
      await redis.setex(lastRequestKey, 3600, now.toString()); // Expira en 1 hora
    }

    // Incrementar contador (expira en 1 hora)
    const newCount = await redis.incr(countKey);
    await redis.expire(countKey, 3600);

    // Logging para monitoreo
    logger.debug('Chat rate limit check passed', {
      fingerprint,
      messageCount: newCount,
      tier: currentTier.tier,
    });

    next();
  } catch (error) {
    logger.error('Error en chat rate limiting', { error });
    // En caso de error, permitir el request (fail-open)
    next();
  }
}
