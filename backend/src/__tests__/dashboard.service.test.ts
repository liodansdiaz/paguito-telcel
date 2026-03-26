import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database', () => ({
  prisma: {
    reservation: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    customer: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
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

import { DashboardService } from '../modules/dashboard/dashboard.service';
import { prisma } from '../config/database';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DashboardService();
  });

  // ── getAdminMetrics ────────────────────────────────────────────────────────────
  describe('getAdminMetrics', () => {
    it('devuelve métricas sin filtro de fecha', async () => {
      vi.mocked(prisma.reservation.count)
        .mockResolvedValueOnce(5)   // reservasHoy
        .mockResolvedValueOnce(20)  // reservasSemana
        .mockResolvedValueOnce(80)  // reservasMes
        .mockResolvedValueOnce(15)  // activas
        .mockResolvedValueOnce(50)  // completadas
        .mockResolvedValueOnce(10)  // canceladas
        .mockResolvedValueOnce(3);  // sinStock
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(8)   // vendedoresActivos
        .mockResolvedValueOnce(2);  // vendedoresInactivos
      vi.mocked(prisma.customer.count).mockResolvedValueOnce(120);

      const result = await service.getAdminMetrics();

      expect(result).toEqual({
        reservasHoy: 5,
        reservasSemana: 20,
        reservasMes: 80,
        activas: 15,
        completadas: 50,
        canceladas: 10,
        sinStock: 3,
        vendedoresActivos: 8,
        vendedoresInactivos: 2,
        totalClientes: 120,
      });
      expect(prisma.reservation.count).toHaveBeenCalledTimes(7);
      expect(prisma.user.count).toHaveBeenCalledTimes(2);
      expect(prisma.customer.count).toHaveBeenCalledTimes(1);
    });

    it('devuelve métricas con filtro de fecha', async () => {
      const fechaDesde = new Date('2026-03-01');
      const fechaHasta = new Date('2026-03-26');

      vi.mocked(prisma.reservation.count)
        .mockResolvedValueOnce(30)  // reservasHoy (con filtro)
        .mockResolvedValueOnce(30)  // reservasSemana (con filtro)
        .mockResolvedValueOnce(30)  // reservasMes (con filtro)
        .mockResolvedValueOnce(15)  // activas
        .mockResolvedValueOnce(50)  // completadas
        .mockResolvedValueOnce(10)  // canceladas
        .mockResolvedValueOnce(3);  // sinStock
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);
      vi.mocked(prisma.customer.count).mockResolvedValueOnce(120);

      const result = await service.getAdminMetrics({ fechaDesde, fechaHasta });

      expect(result.reservasHoy).toBe(30);
      expect(result.reservasSemana).toBe(30);
      expect(result.reservasMes).toBe(30);

      // Las llamadas con filtro usan createdAt con gte/lte
      expect(prisma.reservation.count).toHaveBeenCalledWith({
        where: { createdAt: { gte: fechaDesde, lte: fechaHasta } },
      });
    });
  });

  // ── getChartData ───────────────────────────────────────────────────────────────
  describe('getChartData', () => {
    it('devuelve datos de gráfico', async () => {
      const mockRows = [
        { day: new Date('2026-03-24T00:00:00.000Z'), count: BigInt(5) },
        { day: new Date('2026-03-25T00:00:00.000Z'), count: BigInt(3) },
      ];
      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockRows);

      const fechaDesde = new Date('2026-03-24T00:00:00.000Z');
      const fechaHasta = new Date('2026-03-25T23:59:59.999Z');

      const result = await service.getChartData({ fechaDesde, fechaHasta });

      // El while loop es inclusivo, así que 24 y 25 se incluyen
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((r) => r.count === 5)).toBe(true);
      expect(result.some((r) => r.count === 3)).toBe(true);
      expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    });

    it('rellena días sin reservas con 0', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        { day: new Date('2026-03-24T00:00:00.000Z'), count: BigInt(5) },
      ]);

      const fechaDesde = new Date('2026-03-24T00:00:00.000Z');
      const fechaHasta = new Date('2026-03-26T23:59:59.999Z');

      const result = await service.getChartData({ fechaDesde, fechaHasta });

      // El rango genera al menos 3 días
      expect(result.length).toBeGreaterThanOrEqual(3);
      // Algunos días tienen datos y otros 0
      expect(result.some((r) => r.count === 5)).toBe(true);
      expect(result.some((r) => r.count === 0)).toBe(true);
    });
  });

  // ── getStatusDistribution ──────────────────────────────────────────────────────
  describe('getStatusDistribution', () => {
    it('devuelve distribución por estado', async () => {
      vi.mocked(prisma.reservation.groupBy).mockResolvedValue([
        { estado: 'COMPLETADA', _count: { estado: 50 } },
        { estado: 'NUEVA', _count: { estado: 10 } },
        { estado: 'CANCELADA', _count: { estado: 5 } },
      ] as any);

      const result = await service.getStatusDistribution();

      expect(result).toEqual([
        { estado: 'COMPLETADA', count: 50 },
        { estado: 'NUEVA', count: 10 },
        { estado: 'CANCELADA', count: 5 },
      ]);
      expect(prisma.reservation.groupBy).toHaveBeenCalledWith({
        by: ['estado'],
        _count: { estado: true },
        where: {},
      });
    });

    it('filtra estados con count 0', async () => {
      vi.mocked(prisma.reservation.groupBy).mockResolvedValue([
        { estado: 'COMPLETADA', _count: { estado: 20 } },
        { estado: 'SIN_STOCK', _count: { estado: 0 } },
      ] as any);

      const result = await service.getStatusDistribution();

      expect(result).toEqual([
        { estado: 'COMPLETADA', count: 20 },
      ]);
    });
  });

  // ── getVendorRanking ───────────────────────────────────────────────────────────
  describe('getVendorRanking', () => {
    it('devuelve ranking de vendedores', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          id: 'vendor-1',
          nombre: 'Luis Martínez',
          zona: 'Tapachula',
          isActive: true,
          _count: { reservations: 10 },
          reservations: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }],
        },
        {
          id: 'vendor-2',
          nombre: 'Ana López',
          zona: 'Tuxtla',
          isActive: true,
          _count: { reservations: 8 },
          reservations: [{ id: 'r4' }],
        },
      ] as any);

      const result = await service.getVendorRanking();

      // Ordenado por totalVendidas desc
      expect(result).toEqual([
        { id: 'vendor-1', nombre: 'Luis Martínez', zona: 'Tapachula', isActive: true, totalAsignadas: 10, totalVendidas: 3 },
        { id: 'vendor-2', nombre: 'Ana López', zona: 'Tuxtla', isActive: true, totalAsignadas: 8, totalVendidas: 1 },
      ]);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rol: 'VENDEDOR' },
        })
      );
    });

    it('aplica filtro de fecha en el ranking', async () => {
      const fechaDesde = new Date('2026-03-01');
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await service.getVendorRanking({ fechaDesde });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rol: 'VENDEDOR' },
          select: expect.objectContaining({
            _count: expect.objectContaining({
              select: { reservations: { where: { createdAt: { gte: fechaDesde } } } },
            }),
          }),
        })
      );
    });
  });

  // ── getVendorDashboard ─────────────────────────────────────────────────────────
  describe('getVendorDashboard', () => {
    it('devuelve métricas de un vendedor', async () => {
      vi.mocked(prisma.reservation.count)
        .mockResolvedValueOnce(25)  // asignadas
        .mockResolvedValueOnce(5)   // activas
        .mockResolvedValueOnce(18)  // completadas
        .mockResolvedValueOnce(3);  // pendientesHoy

      const result = await service.getVendorDashboard('vendor-uuid-001');

      expect(result).toEqual({
        asignadas: 25,
        activas: 5,
        completadas: 18,
        pendientesHoy: 3,
      });
      expect(prisma.reservation.count).toHaveBeenCalledTimes(4);
      expect(prisma.reservation.count).toHaveBeenCalledWith({ where: { vendorId: 'vendor-uuid-001' } });
    });
  });
});
