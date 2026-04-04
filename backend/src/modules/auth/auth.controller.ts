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
      // Configurar cookie para refresh token
      res.cookie('refreshToken', result.refreshToken, authService.getRefreshTokenCookieOptions());
      // Devolver access token y datos del usuario (NO el refresh token en el body por seguridad)
      sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login exitoso');
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

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
      await authService.logout(refreshToken);
      sendSuccess(res, null, 'Sesión cerrada correctamente');
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

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const result = await authService.forgotPassword(email);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = z.object({
        token: z.string().min(1, 'Token requerido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
      }).parse(req.body);
      const result = await authService.resetPassword(token, password);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
