import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt';
import { AppError } from './error.middleware';
import { Rol } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  email: string;
  rol: Rol;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware de autenticación
 * Valida el JWT y adjunta el usuario al request
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // ❌ NO usar throw en middleware Express - usar next(err)
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No autorizado. Token requerido.', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtConfig.secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return next(new AppError('Token inválido o expirado.', 401));
  }
};

/**
 * Middleware de autorización
 * Verifica que el usuario tenga el rol requerido
 */
export const requireRole = (...roles: Rol[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autorizado.', 401));
    }
    if (!roles.includes(req.user.rol)) {
      return next(new AppError('Acceso denegado. Permisos insuficientes.', 403));
    }
    next();
  };
};
