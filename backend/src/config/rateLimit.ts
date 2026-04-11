import rateLimit from 'express-rate-limit';
import { getRedisClient } from './redis';

/**
 * Si Redis está conectado, usa Redis como store para que los rate limits
 * se compartan entre múltiples instancias del servidor.
 * Si no, usa el store en memoria (default de express-rate-limit).
 */
function getRedisStore() {
  const redis = getRedisClient();
  if (!redis) return undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RedisStore } = require('rate-limit-redis');
    return new RedisStore({
      sendCommand: (...args: string[]) => (redis as any).call(...args),
    });
  } catch {
    return undefined;
  }
}

const redisStore = getRedisStore();

/**
 * Rate limiter para el endpoint de login.
 * Máximo 10 intentos por IP cada 15 minutos.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

/**
 * Rate limiter para el endpoint de refresh de token.
 * Máximo 30 intentos por IP cada 15 minutos.
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Demasiadas solicitudes de renovación de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

/**
 * Rate limiter para la creación de reservas públicas.
 * Máximo 5 reservas por IP cada hora.
 */
export const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Has realizado demasiadas reservas. Por favor espera una hora antes de intentar nuevamente.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

/**
 * Rate limiter para consulta de reservas por folio o CURP.
 * Máximo 20 intentos por IP cada hora.
 */
export const consultaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Has realizado demasiadas consultas. Por favor espera una hora antes de intentar nuevamente.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

/**
 * Rate limiter para cancelación de reservas por el cliente.
 * Máximo 10 intentos por IP cada hora.
 */
export const cancelarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Has realizado demasiados intentos de cancelación. Por favor espera una hora antes de intentar nuevamente.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

/**
 * Rate limiter para el chat con IA.
 * Máximo 20 mensajes por IP cada minuto.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Has enviado demasiados mensajes. Por favor espera un momento antes de continuar.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

/**
 * Rate limiter para recuperación de contraseña.
 * Máximo 3 solicitudes por IP cada hora (previene abuso de email).
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Has solicitado demasiados restablecimientos de contraseña. Por favor espera una hora antes de intentar nuevamente.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

/**
 * Rate limiter para intento de reset de contraseña (con token).
 * Máximo 5 intentos por IP cada hora.
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Has intentado restablecer tu contraseña demasiadas veces. Por favor espera una hora.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});
