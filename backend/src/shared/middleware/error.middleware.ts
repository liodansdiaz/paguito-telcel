import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

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
    body: req.body,
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
