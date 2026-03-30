import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

// Campos sensibles que nunca deben loggearse
const SENSITIVE_FIELDS = ['password', 'newPassword', 'oldPassword', 'token', 'refreshToken', 'apiKey', 'secret'];

function sanitizeBody(body: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return body;
  const sanitized: Record<string, unknown> = { ...body };
  for (const key of SENSITIVE_FIELDS) {
    if (key in sanitized) sanitized[key] = '[REDACTED]';
  }
  return sanitized;
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
  logger.error(`${req.method} ${req.path} - ${err.message}`, {
    stack: err.stack,
    body: sanitizeBody(req.body),
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null,
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
    });
  }

  // Prisma errors
  if ((err as any).code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un registro con ese dato único',
      errors: null,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    errors: process.env.NODE_ENV === 'development' ? err.message : null,
  });
};
