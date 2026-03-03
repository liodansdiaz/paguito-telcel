import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { jwtConfig } from '../../config/jwt';
import { AppError } from '../../shared/middleware/error.middleware';
import { AuthPayload } from '../../shared/middleware/auth.middleware';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new AppError('Credenciales inválidas o cuenta inactiva.', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Credenciales inválidas.', 401);
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, rol: user.rol };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn as any,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        zona: user.zona,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, jwtConfig.refreshSecret) as AuthPayload;

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) {
        throw new AppError('Usuario no encontrado o inactivo.', 401);
      }

      const newPayload: AuthPayload = { userId: user.id, email: user.email, rol: user.rol };
      const accessToken = jwt.sign(newPayload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn as any,
      });

      return { accessToken };
    } catch {
      throw new AppError('Refresh token inválido o expirado.', 401);
    }
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        zona: true,
        telefono: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('Usuario no encontrado.', 404);
    return user;
  }
}

export const authService = new AuthService();
