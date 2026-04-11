import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '../../config/database';
import { jwtConfig } from '../../config/jwt';
import { AppError } from '../../shared/middleware/error.middleware';
import { AuthPayload } from '../../shared/middleware/auth.middleware';
import { emailService } from '../../shared/services/email.service';
import { logger } from '../../shared/utils/logger';

/**
 * Hashea un token de recuperación usando SHA-256.
 * El token original se envía al email, el hash se guarda en BD.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días en segundos

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  path: '/',
};

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // ❌ IMPORTANTE: No revelar si el usuario existe o la contraseña es incorrecta
    // Mismo mensaje para evitar enumeración de usuarios
    if (!user || !user.isActive) {
      // NOTA: Por seguridad, NO loggeamos intentos fallidos con emails
      // porque permitiría verificar qué emails están registrados
      // Los logs de intentos fallen pueden habilitarse en producción
      // con un sistema de detección de abuso separado
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

    // ✓ Solo loggeamos logins exitosos (no exponen información sensible)
    logger.info(`🔐 Login exitoso: userId=${user.id}, rol=${user.rol}`);

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

  getRefreshTokenCookieOptions() {
    return cookieOptions;
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

  async logout(refreshToken: string, userEmail?: string) {
    // Marcar el token como revocado — si no existe simplemente ignoramos
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    
    // ✓ Loggear sin email - solo indica que hubo logout
    if (userEmail) {
      logger.info(`🔐 Logout exitoso`);
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

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Por seguridad, siempre devolvemos éxito aunque el usuario no exista
    // así no revelamos qué emails están registrados
    if (!user || !user.isActive) {
      return { message: 'Si el correo existe, recibirás un enlace de recuperación.' };
    }

    // Generar token de recuperación (válido 1 hora)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken); // Hashear antes de guardar
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar el HASH del token, NO el token original
    await prisma.passwordResetToken.create({
      data: { token: tokenHash, userId: user.id, expiresAt },
    });

    // Construir URL de recuperación (enviar el token ORIGINAL al email)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    // Enviar email
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { background: #fff; border-radius: 8px; max-width: 500px; margin: 0 auto; padding: 30px; }
    .header { background: #0f49bd; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -30px -30px 20px; }
    .btn { display: inline-block; background: #0f49bd; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
    .note { background: #fef3cd; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; font-size: 13px; color: #92400e; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Recuperar contraseña</h2>
    </div>
    <p>Hola ${user.nombre},</p>
    <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Amigos Paguito Telcel</strong>.</p>
    <div class="note">
      <strong>Nota:</strong> Este enlace vence en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.
    </div>
    <a href="${resetUrl}" class="btn">Restablecer mi contraseña</a>
    <p style="font-size: 12px; color: #666;">O copia y pega este enlace en tu navegador:<br>${resetUrl}</p>
    <div class="footer">
      <p>Amigos Paguito Telcel — Sistema de Reservas</p>
    </div>
  </div>
</body>
</html>`;

    try {
      await emailService.send({
        to: user.email,
        subject: 'Recupera tu contraseña — Amigos Paguito Telcel',
        html,
      });
    } catch (err) {
      logger.error(`Error enviando email de recuperación a ${user.email}:`, err);
    }

    return { message: 'Si el correo existe, recibirás un enlace de recuperación.' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Hashear el token antes de buscar en BD
    const tokenHash = hashToken(token);

    // Buscar token por el HASH (no por el token original)
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new AppError('Token de recuperación inválido.', 400);
    }

    if (resetToken.usedAt) {
      throw new AppError('Este enlace ya fue utilizado.', 400);
    }

    if (resetToken.expiresAt < new Date()) {
      throw new AppError('El enlace de recuperación ha expirado. Solicita uno nuevo.', 400);
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Revocar todos los refresh tokens del usuario (sesiones activas)
    await prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    logger.info(`Password reset completed for user ${resetToken.userId}`);
    return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }
}

export const authService = new AuthService();
