import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response.helper';
import { 
  loginSchema, 
  refreshTokenSchema, 
  logoutSchema, 
  forgotPasswordSchema,
  resetPasswordSchema 
} from '../../dtos';

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
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const result = await authService.refresh(refreshToken ?? '');
      sendSuccess(res, result, 'Token renovado');
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = logoutSchema.parse(req.body);
      const userEmail = req.user?.email;
      await authService.logout(refreshToken ?? '', userEmail);
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
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(email);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(token, newPassword);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
