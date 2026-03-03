import { prisma } from '../../config/database';

export class DashboardService {
  async getAdminMetrics() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      reservasHoy, reservasSemana, reservasMes,
      activas, completadas, canceladas, sinStock,
      vendedoresActivos, vendedoresInactivos,
      totalClientes,
    ] = await Promise.all([
      prisma.reservation.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.reservation.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.reservation.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.reservation.count({ where: { estado: { in: ['NUEVA', 'ASIGNADA', 'EN_VISITA'] } } }),
      prisma.reservation.count({ where: { estado: 'VENDIDA' } }),
      prisma.reservation.count({ where: { estado: 'CANCELADA' } }),
      prisma.reservation.count({ where: { estado: 'SIN_STOCK' } }),
      prisma.user.count({ where: { isActive: true, rol: 'VENDEDOR' } }),
      prisma.user.count({ where: { isActive: false, rol: 'VENDEDOR' } }),
      prisma.customer.count(),
    ]);

    return {
      reservasHoy,
      reservasSemana,
      reservasMes,
      activas,
      completadas,
      canceladas,
      sinStock,
      vendedoresActivos,
      vendedoresInactivos,
      totalClientes,
    };
  }

  async getChartData() {
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const count = await prisma.reservation.count({
        where: { createdAt: { gte: start, lt: end } },
      });

      days.push({
        date: start.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
        count,
      });
    }
    return days;
  }

  async getStatusDistribution() {
    const statuses = ['NUEVA', 'ASIGNADA', 'EN_VISITA', 'VENDIDA', 'NO_CONCRETADA', 'CANCELADA', 'SIN_STOCK'];
    const results = await Promise.all(
      statuses.map(async (estado) => ({
        estado,
        count: await prisma.reservation.count({ where: { estado: estado as any } }),
      }))
    );
    return results.filter((r) => r.count > 0);
  }

  async getVendorRanking() {
    const vendors = await prisma.user.findMany({
      where: { rol: 'VENDEDOR' },
      select: {
        id: true,
        nombre: true,
        zona: true,
        isActive: true,
        _count: { select: { reservations: true } },
        reservations: {
          where: { estado: 'VENDIDA' },
          select: { id: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return vendors
      .map((v) => ({
        id: v.id,
        nombre: v.nombre,
        zona: v.zona,
        isActive: v.isActive,
        totalAsignadas: v._count.reservations,
        totalVendidas: v.reservations.length,
      }))
      .sort((a, b) => b.totalVendidas - a.totalVendidas);
  }

  async getVendorDashboard(vendorId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    const [asignadas, activas, completadas, pendientesHoy] = await Promise.all([
      prisma.reservation.count({ where: { vendorId } }),
      prisma.reservation.count({ where: { vendorId, estado: { in: ['ASIGNADA', 'EN_VISITA'] } } }),
      prisma.reservation.count({ where: { vendorId, estado: 'VENDIDA' } }),
      prisma.reservation.count({
        where: {
          vendorId,
          estado: { in: ['ASIGNADA', 'NUEVA'] },
          fechaPreferida: { gte: startOfToday, lt: endOfToday },
        },
      }),
    ]);

    return { asignadas, activas, completadas, pendientesHoy };
  }
}

export const dashboardService = new DashboardService();
