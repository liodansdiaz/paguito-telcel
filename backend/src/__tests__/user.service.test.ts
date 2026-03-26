import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks de módulos con dependencias externas ────────────────────────────────

vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock('../../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Imports post-mock ─────────────────────────────────────────────────────────
import { UserService } from '../modules/users/user.service';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

// ── Datos de prueba reutilizables ─────────────────────────────────────────────
const mockUser = {
  id: 'user-uuid-001',
  nombre: 'Luis Martínez',
  email: 'luis@paguito.com',
  rol: 'VENDEDOR',
  isActive: true,
  zona: 'Chiapas',
  telefono: '9611112222',
  lastAssignedAt: new Date('2026-03-20T10:00:00Z'),
  createdAt: new Date('2026-01-15T08:00:00Z'),
  updatedAt: new Date('2026-03-01T12:00:00Z'),
  _count: { reservations: 5 },
};

const mockUser2 = {
  id: 'user-uuid-002',
  nombre: 'Ana García',
  email: 'ana@paguito.com',
  rol: 'VENDEDOR',
  isActive: false,
  zona: 'Oaxaca',
  telefono: '9623334444',
  lastAssignedAt: null,
  createdAt: new Date('2026-02-01T09:00:00Z'),
  updatedAt: new Date('2026-02-15T14:00:00Z'),
  _count: { reservations: 0 },
};

const mockCreatedUser = {
  id: 'user-uuid-003',
  nombre: 'Pedro Ramírez',
  email: 'pedro@paguito.com',
  rol: 'VENDEDOR',
  isActive: true,
  zona: 'Tabasco',
  telefono: '9635556666',
  createdAt: new Date(),
};

const mockUpdatedUser = {
  id: 'user-uuid-001',
  nombre: 'Luis Martínez Actualizado',
  email: 'luis@paguito.com',
  rol: 'ADMIN',
  isActive: true,
  zona: 'Chiapas',
  telefono: '9611112222',
  updatedAt: new Date(),
};

// ─────────────────────────────────────────────────────────────────────────────

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  // ── getAll ────────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('devuelve lista de usuarios con filtros', async () => {
      const mockResult = [mockUser, mockUser2];
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockResult as any);

      const result = await service.getAll();

      expect(result).toEqual(mockResult);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nombre: 'asc' },
        })
      );
    });

    it('filtra por search (nombre, email, zona)', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser] as any);

      await service.getAll({ search: 'Luis' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { nombre: { contains: 'Luis', mode: 'insensitive' } },
              { email: { contains: 'Luis', mode: 'insensitive' } },
              { zona: { contains: 'Luis', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('filtra por isActive', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser] as any);

      await service.getAll({ isActive: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('filtra por rol', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser] as any);

      await service.getAll({ rol: 'VENDEDOR' as any });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rol: 'VENDEDOR' }),
        })
      );
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('devuelve usuario si existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await service.getById('user-uuid-001');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-001' },
        })
      );
    });

    it('lanza 404 si no existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(service.getById('inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── create ────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('crea usuario exitosamente', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password-123' as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);

      const dto = {
        nombre: 'Pedro Ramírez',
        email: 'pedro@paguito.com',
        password: 'password123',
        zona: 'Tabasco',
        telefono: '9635556666',
      };

      const result = await service.create(dto);

      expect(result).toEqual(mockCreatedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'pedro@paguito.com' } })
      );
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('lanza 409 si email ya existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const dto = {
        nombre: 'Duplicado',
        email: 'luis@paguito.com',
        password: 'password123',
      };

      await expect(service.create(dto))
        .rejects.toMatchObject({ statusCode: 409 });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashea password antes de guardar', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password-xyz' as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);

      const dto = {
        nombre: 'Pedro Ramírez',
        email: 'pedro@paguito.com',
        password: 'miPassword123',
      };

      await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('miPassword123', 12);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed-password-xyz',
          }),
        })
      );
    });
  });

  // ── update ────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('actualiza usuario correctamente', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser as any);

      const data = { nombre: 'Luis Martínez Actualizado', rol: 'ADMIN' as any };
      const result = await service.update('user-uuid-001', data);

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-uuid-001' } })
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-001' },
          data: expect.objectContaining({ nombre: 'Luis Martínez Actualizado', rol: 'ADMIN' }),
        })
      );
    });

    it('hashea password si se proporciona', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.hash).mockResolvedValue('nuevo-hash-456' as never);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser as any);

      await service.update('user-uuid-001', { password: 'nuevaClave456' });

      expect(bcrypt.hash).toHaveBeenCalledWith('nuevaClave456', 12);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'nuevo-hash-456',
          }),
        })
      );
    });

    it('lanza 404 si usuario no existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(service.update('inexistente', { nombre: 'Test' }))
        .rejects.toMatchObject({ statusCode: 404 });

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ── toggleActive ──────────────────────────────────────────────────────────────
  describe('toggleActive', () => {
    it('cambia estado de activo a inactivo', async () => {
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({ ...mockUser, isActive: true } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-uuid-001',
        nombre: 'Luis Martínez',
        isActive: false,
      } as any);

      const result = await service.toggleActive('user-uuid-001');

      expect(result.isActive).toBe(false);
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-uuid-001' } })
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-001' },
          data: { isActive: false },
        })
      );
    });

    it('cambia estado de inactivo a activo', async () => {
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({ ...mockUser, isActive: false } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-uuid-001',
        nombre: 'Luis Martínez',
        isActive: true,
      } as any);

      const result = await service.toggleActive('user-uuid-001');

      expect(result.isActive).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-001' },
          data: { isActive: true },
        })
      );
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('elimina usuario si existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.delete).mockResolvedValue(mockUser as any);

      await service.delete('user-uuid-001');

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-uuid-001' } })
      );
      expect(prisma.user.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-uuid-001' } })
      );
    });

    it('lanza 404 si usuario no existe', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(service.delete('inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });

      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
