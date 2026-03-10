import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { jwtConfig } from '../../config/jwt';
import { AppError } from '../../shared/middleware/error.middleware';
import { AuthPayload } from '../../shared/middleware/auth.middleware';

// 7 días en milisegundos — debe coincidir con JWT_REFRESH_EXPIRES_IN
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

    // Guardar el refresh token en BD para poder revocarlo después
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    // Limpiar tokens expirados del usuario para no acumular registros
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
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
    // Verificar firma y expiración del JWT
    let payload: AuthPayload;
    try {
      payload = jwt.verify(refreshToken, jwtConfig.refreshSecret) as AuthPayload;
    } catch {
      throw new AppError('Refresh token inválido o expirado.', 401);
    }

    // Verificar que el token existe en BD y no ha sido revocado
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revokedAt !== null || storedToken.expiresAt < new Date()) {
      throw new AppError('Refresh token inválido, revocado o expirado.', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw new AppError('Usuario no encontrado o inactivo.', 401);
    }

    const newPayload: AuthPayload = { userId: user.id, email: user.email, rol: user.rol };
    const accessToken = jwt.sign(newPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as any,
    });

    return { accessToken };
  }

  async logout(refreshToken: string) {
    // Marcar el token como revocado — si no existe simplemente ignoramos
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
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
