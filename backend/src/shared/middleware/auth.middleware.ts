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

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No autorizado. Token requerido.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtConfig.secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError('Token inválido o expirado.', 401);
  }
};

export const requireRole = (...roles: Rol[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError('No autorizado.', 401);
    if (!roles.includes(req.user.rol)) {
      throw new AppError('Acceso denegado. Permisos insuficientes.', 403);
    }
    next();
  };
};
