import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';

// Campos sensibles que nunca deben loggearse
const SENSITIVE_FIELDS = ['password', 'newPassword', 'oldPassword', 'token', 'refreshToken', 'apiKey', 'secret', 'curp'];

function sanitizeBody(body: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return body;
  const sanitized: Record<string, unknown> = { ...body };
  for (const key of SENSITIVE_FIELDS) {
    if (key in sanitized) sanitized[key] = '[REDACTED]';
  }
  return sanitized;
}

/**
 * Genera un request ID único para tracking
 */
function generateRequestId(): string {
  return randomBytes(8).toString('hex');
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public errors?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Generar request ID para tracking (o usar existente)
  const requestId = (req as any).requestId || generateRequestId();
  (req as any).requestId = requestId;

  // Determinar tipo de error (4xx = cliente, 5xx = servidor)
  const isClientError = err instanceof AppError && err.statusCode < 500;
  const isValidationError = err instanceof ZodError;
  const isPrismaError = (err as any)?.code?.startsWith('P');

  // Logging diferenciado según tipo de error
  if (isClientError) {
    // Errores 4xx - solo warn, no stack trace
    logger.warn(`${req.method} ${req.path} - ${err.message}`, {
      requestId,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  } else if (isValidationError) {
    // Errores de validación
    const issues = (err as ZodError).issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    logger.warn(`${req.method} ${req.path} - Validación fallida: ${issues}`, {
      requestId,
      ip: req.ip,
    });
  } else {
    // Errores 5xx - error completo con stack
    logger.error(`${req.method} ${req.path} - ${err.message}`, {
      requestId,
      stack: err.stack,
      body: sanitizeBody(req.body),
      userId: req.user?.userId,
      ip: req.ip,
    });
  }

  // Configurar headers de response
  res.setHeader('X-Request-Id', requestId);

  // Responder según tipo de error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null,
      requestId, // Incluir para debugging
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Error de validación',
      errors: err.issues.map((e: any) => ({
        field: (e.path as PropertyKey[]).join('.'),
        message: e.message as string,
      })),
      requestId,
    });
  }

  // Prisma errors
  if ((err as any).code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un registro con ese dato único',
      errors: null,
      requestId,
    });
  }

  // Error interno - no exponer detalles en producción
  const errorMessage = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Error interno del servidor';
  
  return res.status(500).json({
    success: false,
    message: errorMessage,
    errors: process.env.NODE_ENV === 'development' ? err.message : null,
    requestId,
  });
};
