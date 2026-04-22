import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks de módulos con dependencias externas ────────────────────────────────

vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock('../shared/services/email.service', () => ({
  emailService: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../config/jwt', () => ({
  jwtConfig: {
    secret: 'test-secret',
    refreshSecret: 'test-refresh-secret',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
}));

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    randomBytes: vi.fn().mockReturnValue({
      toString: vi.fn().mockReturnValue('fake-reset-token-abc123'),
    }),
  };
});

// ── Imports post-mock ─────────────────────────────────────────────────────────
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { emailService } from '../shared/services/email.service';

// ── Datos de prueba reutilizables ─────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-001',
  nombre: 'Juan Pérez',
  email: 'juan@paguito.com',
  password: '$2b$12$hashedpassword',
  rol: 'ADMIN',
  zona: 'Chiapas',
  telefono: '9611234567',
  isActive: true,
  createdAt: new Date('2025-01-01'),
};

const mockRefreshToken = {
  id: 'rt-uuid-001',
  token: 'valid-refresh-token',
  userId: mockUser.id,
  revokedAt: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // futuro
  createdAt: new Date(),
};

const mockExpiredRefreshToken = {
  ...mockRefreshToken,
  expiresAt: new Date(Date.now() - 1000), // pasado
};

const mockRevokedRefreshToken = {
  ...mockRefreshToken,
  revokedAt: new Date(),
};

const mockPayload = {
  userId: mockUser.id,
  email: mockUser.email,
  rol: mockUser.rol,
};

const mockResetToken = {
  id: 'prt-uuid-001',
  token: 'fake-reset-token-abc123',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora, futuro
  usedAt: null,
  createdAt: new Date(),
  user: mockUser,
};

// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  // ── login ──────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('éxito con credenciales válidas', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign)
        .mockReturnValueOnce('access-token-123' as never)
        .mockReturnValueOnce('refresh-token-456' as never);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue(mockRefreshToken as any);
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 0 } as any);

      const result = await service.login('juan@paguito.com', 'password123');

      expect(result.accessToken).toBe('access-token-123');
      expect(result.user).toEqual({
        id: mockUser.id,
        nombre: mockUser.nombre,
        email: mockUser.email,
        rol: mockUser.rol,
        zona: mockUser.zona,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
    });

    it('lanza 401 si usuario no existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(service.login('noexiste@paguito.com', 'password123'))
        .rejects.toMatchObject({ statusCode: 401 });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('lanza 401 si usuario está inactivo', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, isActive: false } as any);

      await expect(service.login('juan@paguito.com', 'password123'))
        .rejects.toMatchObject({ statusCode: 401 });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('lanza 401 si password es incorrecto', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login('juan@paguito.com', 'wrongpassword'))
        .rejects.toMatchObject({ statusCode: 401 });

      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  // ── refresh ────────────────────────────────────────────────────────────────
  describe('refresh', () => {
    it('éxito con token válido', async () => {
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as never);
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockRefreshToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(jwt.sign).mockReturnValue('new-access-token' as never);

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret');
    });

    it('lanza 401 si token JWT es inválido', async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.refresh('invalid-token'))
        .rejects.toMatchObject({ statusCode: 401 });

      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('lanza 401 si token no existe en BD', async () => {
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as never);
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null);

      await expect(service.refresh('nonexistent-token'))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('lanza 401 si token fue revocado', async () => {
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as never);
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockRevokedRefreshToken as any);

      await expect(service.refresh('revoked-token'))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('lanza 401 si token expiró', async () => {
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as never);
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockExpiredRefreshToken as any);

      await expect(service.refresh('expired-token'))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('lanza 401 si usuario está inactivo', async () => {
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as never);
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockRefreshToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, isActive: false } as any);

      await expect(service.refresh('valid-refresh-token'))
        .rejects.toMatchObject({ statusCode: 401 });
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('marca token como revocado', async () => {
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 } as any);

      await service.logout('valid-refresh-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'valid-refresh-token', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  // ── me ─────────────────────────────────────────────────────────────────────
  describe('me', () => {
    it('devuelve usuario si existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await service.me('user-uuid-001');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid-001' },
        select: expect.objectContaining({
          id: true,
          nombre: true,
          email: true,
          rol: true,
          zona: true,
          telefono: true,
          isActive: true,
          createdAt: true,
        }),
      });
    });

    it('lanza 404 si usuario no existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(service.me('user-inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── forgotPassword ─────────────────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('devuelve mensaje genérico (siempre éxito)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await service.forgotPassword('noexiste@paguito.com');

      expect(result).toEqual({
        message: 'Si el correo existe, recibirás un enlace de recuperación.',
      });
    });

    it('genera token y envía email si usuario existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.passwordResetToken.create).mockResolvedValue(mockResetToken as any);
      vi.mocked(emailService.send).mockResolvedValue(undefined as any);

      const result = await service.forgotPassword('juan@paguito.com');

      expect(result.message).toBeDefined();
      expect(prisma.passwordResetToken.create).toHaveBeenCalledOnce();
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'juan@paguito.com',
          subject: expect.stringContaining('Recupera tu contraseña'),
        })
      );
    });

    it('no envía email si usuario no existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await service.forgotPassword('noexiste@paguito.com');

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  // ── resetPassword ──────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('éxito con token válido', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(mockResetToken as any);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2b$12$newhashed' as never);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.passwordResetToken.update).mockResolvedValue(mockResetToken as any);
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 } as any);

      const result = await service.resetPassword('fake-reset-token-abc123', 'newPassword123');

      expect(result.message).toBe('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockResetToken.userId },
        data: { password: '$2b$12$newhashed' },
      });
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: mockResetToken.id },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockResetToken.userId, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('lanza 400 si token no existe', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);

      await expect(service.resetPassword('token-inexistente', 'newPassword123'))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 400 si token ya fue usado', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        ...mockResetToken,
        usedAt: new Date(),
      } as any);

      await expect(service.resetPassword('fake-reset-token-abc123', 'newPassword123'))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 400 si token expiró', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        ...mockResetToken,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
      } as any);

      await expect(service.resetPassword('fake-reset-token-abc123', 'newPassword123'))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
