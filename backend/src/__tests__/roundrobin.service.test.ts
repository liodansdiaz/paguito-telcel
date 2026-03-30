import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de Prisma ANTES de importar el servicio
vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { RoundRobinService } from '../shared/services/roundrobin.service';
import { prisma } from '../config/database';

const makeVendor = (id: string, lastAssignedAt: Date | null = null) => ({
  id,
  nombre: `Vendedor ${id}`,
  email: `${id}@test.com`,
  lastAssignedAt,
});

describe('RoundRobinService', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
  });

  describe('getNextVendor', () => {
    it('lanza AppError 503 si no hay vendedores activos', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(RoundRobinService.getNextVendor())
        .rejects.toMatchObject({ statusCode: 503 });
    });

    it('selecciona el único vendedor disponible', async () => {
      const vendedor = makeVendor('v1');
      vi.mocked(prisma.user.findFirst).mockResolvedValue(vendedor as any);

      const result = await RoundRobinService.getNextVendor();

      expect(result).toBe('v1');
    });

    it('selecciona el primer vendedor de la lista ordenada (el que menos asignaciones tiene)', async () => {
      // Prisma devuelve el primer resultado (ya ordenado por findFirst)
      const vendedor = makeVendor('v1', null);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(vendedor as any);

      const result = await RoundRobinService.getNextVendor();

      expect(result).toBe('v1');
    });

    it('actualiza lastAssignedAt del vendedor seleccionado', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(makeVendor('v1') as any);

      await RoundRobinService.getNextVendor();

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { lastAssignedAt: expect.any(Date) },
      });
    });

    it('consulta solo vendedores activos con rol VENDEDOR', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(makeVendor('v1') as any);

      await RoundRobinService.getNextVendor();

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, rol: 'VENDEDOR' },
        })
      );
    });

    it('ordena por lastAssignedAt ASC con NULLs primero', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(makeVendor('v1') as any);

      await RoundRobinService.getNextVendor();

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([
            { lastAssignedAt: { sort: 'asc', nulls: 'first' } },
          ]),
        })
      );
    });

    it('retorna el id correcto del vendedor asignado', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(makeVendor('v-abc-123', new Date('2026-03-01')) as any);

      const result = await RoundRobinService.getNextVendor();

      expect(result).toBe('v-abc-123');
    });

    it('getNearestVendor delega a getNextVendor (no implementado aún)', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(makeVendor('v1') as any);

      // getNearestVendor debe funcionar como fallback al round robin
      const result = await RoundRobinService.getNearestVendor(14.9054, -92.2630);

      expect(result).toBe('v1');
      expect(prisma.user.findFirst).toHaveBeenCalledOnce();
    });
  });
});
