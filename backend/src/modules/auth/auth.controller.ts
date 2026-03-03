import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response.helper';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      sendSuccess(res, result, 'Login exitoso');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
      const result = await authService.refresh(refreshToken);
      sendSuccess(res, result, 'Token renovado');
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.me(req.user!.userId);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
