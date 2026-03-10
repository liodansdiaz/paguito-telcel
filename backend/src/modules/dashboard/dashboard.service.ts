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
    // Una sola query SQL que agrupa por día en los últimos 7 días,
    // en lugar de 7 queries individuales.
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        COUNT(*)::bigint              AS count
      FROM reservations
      WHERE "createdAt" >= ${since}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `;

    // Construir el mapa día → count para rellenar días sin reservas con 0
    const countByDay = new Map<string, number>();
    for (const row of rows) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      countByDay.set(key, Number(row.count));
    }

    // Generar los 7 días siempre en orden, con 0 si no hay datos
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
        count: countByDay.get(key) ?? 0,
      });
    }
    return days;
  }

  async getStatusDistribution() {
    // Una sola query con groupBy en lugar de 7 queries independientes.
    const groups = await prisma.reservation.groupBy({
      by: ['estado'],
      _count: { estado: true },
    });
    return groups
      .map((g) => ({ estado: g.estado, count: g._count.estado }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
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
