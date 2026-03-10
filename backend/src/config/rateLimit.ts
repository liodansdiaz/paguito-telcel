import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para el endpoint de login.
 * Máximo 10 intentos por IP cada 15 minutos.
 * Protege contra ataques de fuerza bruta de contraseñas.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,  // Devuelve cabeceras RateLimit-* estándar
  legacyHeaders: false,   // Desactiva cabeceras X-RateLimit-* antiguas
});

/**
 * Rate limiter para el endpoint de refresh de token.
 * Máximo 30 intentos por IP cada 15 minutos.
 * Evita abuso del refresh silencioso en el cliente.
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: {
    success: false,
    message: 'Demasiadas solicitudes de renovación de sesión. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para la creación de reservas públicas.
 * Máximo 5 reservas por IP cada hora.
 * Evita spam de reservas falsas desde una misma dirección.
 */
export const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: {
    success: false,
    message: 'Has realizado demasiadas reservas. Por favor espera una hora antes de intentar nuevamente.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para consulta de reservas por folio o CURP.
 * Máximo 20 intentos por IP cada hora.
 * Permite varios intentos en caso de error de escritura.
 */
export const consultaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: {
    success: false,
    message: 'Has realizado demasiadas consultas. Por favor espera una hora antes de intentar nuevamente.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para cancelación de reservas por el cliente.
 * Máximo 10 intentos por IP cada hora.
 */
export const cancelarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: {
    success: false,
    message: 'Has realizado demasiados intentos de cancelación. Por favor espera una hora antes de intentar nuevamente.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para el chat con IA.
 * Máximo 20 mensajes por IP cada minuto.
 * Protege contra abuso que puede agotar la cuota de Groq rápidamente.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20,
  message: {
    success: false,
    message: 'Has enviado demasiados mensajes. Por favor espera un momento antes de continuar.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
