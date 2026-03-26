import { prisma } from '../../config/database';

interface DashboardFilters {
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export class DashboardService {
  async getAdminMetrics(filters: DashboardFilters = {}) {
    const { fechaDesde, fechaHasta } = filters;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const hasDateFilter = fechaDesde || fechaHasta;
    
    // Construir filtro de fecha para consultas
    const whereFecha = hasDateFilter 
      ? { 
          createdAt: { 
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
          }
        }
      : {};

    // Nota: cuando hay filtro de fecha, reservasHoy/Semana/Mes retornan el total del rango.
    // El campo reservasRango se incluye para mayor claridad cuando hay filtro activo.
    const [
      reservasHoy, reservasSemana, reservasMes,
      activas, completadas, canceladas, sinStock,
      vendedoresActivos, vendedoresInactivos,
      totalClientes,
    ] = await Promise.all([
      hasDateFilter
        ? prisma.reservation.count({ where: whereFecha })
        : prisma.reservation.count({ where: { createdAt: { gte: startOfToday } } }),
      hasDateFilter
        ? prisma.reservation.count({ where: whereFecha })
        : prisma.reservation.count({ where: { createdAt: { gte: startOfWeek } } }),
      hasDateFilter
        ? prisma.reservation.count({ where: whereFecha })
        : prisma.reservation.count({ where: { createdAt: { gte: startOfMonth } } }),
      
      // Métricas de estado (sin filtro de fecha, siempre son totales)
      prisma.reservation.count({ where: { estado: { in: ['NUEVA', 'ASIGNADA', 'EN_VISITA', 'PARCIAL'] } } }),
      prisma.reservation.count({ where: { estado: 'COMPLETADA' } }),
      prisma.reservation.count({ where: { estado: 'CANCELADA' } }),
      prisma.reservation.count({ where: { estado: 'SIN_STOCK' } }),
      
      // Vendedores y clientes (totales)
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

  async getChartData(filters: DashboardFilters = {}) {
    const { fechaDesde, fechaHasta } = filters;
    
    // Calcular rango de fechas
    let since: Date;
    let until: Date;
    
    if (fechaDesde || fechaHasta) {
      since = fechaDesde || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      until = fechaHasta || new Date();
    } else {
      // Por defecto: últimos 7 días
      since = new Date();
      since.setDate(since.getDate() - 6);
      until = new Date();
    }
    
    since.setHours(0, 0, 0, 0);
    until.setHours(23, 59, 59, 999);

    const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        COUNT(*)::bigint              AS count
      FROM reservations
      WHERE "createdAt" BETWEEN ${since} AND ${until}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `;

    // Construir el mapa día → count para rellenar días sin reservas con 0
    const countByDay = new Map<string, number>();
    for (const row of rows) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      countByDay.set(key, Number(row.count));
    }

    // Generar días en el rango, con 0 si no hay datos
    const days: { date: string; count: number }[] = [];
    const currentDay = new Date(since);
    
    while (currentDay <= until) {
      const key = currentDay.toISOString().slice(0, 10);
      days.push({
        date: currentDay.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
        count: countByDay.get(key) ?? 0,
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  }

  async getStatusDistribution(filters: DashboardFilters = {}) {
    const { fechaDesde, fechaHasta } = filters;
    
    const where = fechaDesde || fechaHasta 
      ? { 
          createdAt: { 
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
          }
        }
      : {};

    const groups = await prisma.reservation.groupBy({
      by: ['estado'],
      _count: { estado: true },
      where,
    });
    return groups
      .map((g) => ({ estado: g.estado, count: g._count.estado }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  async getVendorRanking(filters: DashboardFilters = {}) {
    const { fechaDesde, fechaHasta } = filters;
    
    const reservationWhere = fechaDesde || fechaHasta 
      ? { 
          createdAt: { 
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
          }
        }
      : {};

    const vendors = await prisma.user.findMany({
      where: { rol: 'VENDEDOR' },
      select: {
        id: true,
        nombre: true,
        zona: true,
        isActive: true,
        _count: { 
          select: { 
            reservations: { where: reservationWhere } 
          } 
        },
        reservations: {
          where: { 
            ...reservationWhere,
            estado: 'COMPLETADA' 
          },
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
      prisma.reservation.count({ where: { vendorId, estado: { in: ['ASIGNADA', 'EN_VISITA', 'PARCIAL'] } } }),
      prisma.reservation.count({ where: { vendorId, estado: 'COMPLETADA' } }),
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
