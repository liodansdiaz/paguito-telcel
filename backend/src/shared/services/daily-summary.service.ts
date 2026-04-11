import { prisma } from '../../config/database';
import { emailService } from './email.service';
import { logger } from '../utils/logger';
import { systemConfigService } from '../../modules/system-config/system-config.service';
import { CONFIG_KEYS } from '../../modules/system-config/system-config.service';

interface DailyMetrics {
  reservasHoy: number;
  ventasHoy: number;
  cancelacionesHoy: number;
  reservasSinStock: number;
  productosSinStock: string[];
  vendedoresActivos: number;
  totalReservasActivas: number;
}

export class DailySummaryService {
  /**
   * Recopila las métricas del día actual (desde 00:00 hasta ahora).
   */
  static async getDailyMetrics(): Promise<DailyMetrics> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      reservasHoy,
      ventasHoy,
      cancelacionesHoy,
      reservasSinStock,
      totalReservasActivas,
      vendedoresActivos,
    ] = await Promise.all([
      // Nuevas reservas hoy
      prisma.reservation.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      // Items vendidos hoy (vía reservation_items updatedAt)
      prisma.reservationItem.count({
        where: {
          estado: 'VENDIDO',
          updatedAt: { gte: startOfDay },
        },
      }),
      // Reservas canceladas hoy
      prisma.reservation.count({
        where: {
          estado: 'CANCELADA',
          updatedAt: { gte: startOfDay },
        },
      }),
      // Reservas con items sin stock creadas hoy
      prisma.reservation.count({
        where: {
          estado: 'SIN_STOCK',
          updatedAt: { gte: startOfDay },
        },
      }),
      // Reservas activas totales (pendientes de atención)
      prisma.reservation.count({
        where: { estado: { in: ['NUEVA', 'ASIGNADA', 'EN_VISITA', 'PARCIAL'] } },
      }),
      // Vendedores activos
      prisma.user.count({
        where: { isActive: true, rol: 'VENDEDOR' },
      }),
    ]);

    // Productos sin stock (stock <= 0 y activos)
    const sinStockProducts = await prisma.product.findMany({
      where: { isActive: true, stock: { lte: 0 } },
      select: { nombre: true, marca: true },
    });

    return {
      reservasHoy,
      ventasHoy,
      cancelacionesHoy,
      reservasSinStock,
      productosSinStock: sinStockProducts.map(p => `${p.marca} ${p.nombre}`),
      vendedoresActivos,
      totalReservasActivas,
    };
  }

  /**
   * Envía el resumen diario por email a los administradores configurados.
   */
  static async sendDailySummary(): Promise<void> {
    // Leer configuración de la base de datos
    const resumenConfig = await systemConfigService.getResumenConfig();

    if (!resumenConfig.habilitado) {
      logger.info('DailySummary: resumen deshabilitado, saltando envío');
      return;
    }

    // Verificar si debemos enviar hoy según la frecuencia
    const shouldSendToday = await this.shouldSendToday(resumenConfig.frecuencia, resumenConfig.diaSemana);
    if (!shouldSendToday) {
      logger.info(`DailySummary: no corresponde enviar hoy (frecuencia: ${resumenConfig.frecuencia})`);
      return;
    }

    try {
      const metrics = await this.getDailyMetrics();

      // Obtener admins seleccionados o todos los activos si no hay selección
      let admins = await prisma.user.findMany({
        where: { isActive: true, rol: 'ADMIN' },
        select: { id: true, nombre: true, email: true },
      });

      // Filtrar solo los admins seleccionados si hay lista específica
      if (resumenConfig.adminIds && resumenConfig.adminIds.length > 0) {
        admins = admins.filter(admin => resumenConfig.adminIds.includes(admin.id));
      }

      if (admins.length === 0) {
        logger.warn('DailySummary: no hay administradores configurados para enviar resumen');
        return;
      }

      const fecha = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const subject = `Resumen diario — ${fecha}`;
      const html = this.buildSummaryHtml(fecha, metrics);

      // Enviar a cada admin
      const tasks = admins.map(admin =>
        emailService.send({
          to: admin.email,
          subject,
          html,
        }).catch(err => {
          logger.error(`Error enviando resumen diario a ${admin.email}:`, err);
        })
      );

      await Promise.allSettled(tasks);
      logger.info(`DailySummary enviado a ${admins.length} administrador(es)`);
    } catch (err) {
      logger.error('Error enviando resumen diario:', err);
    }
  }

  /**
   * Determina si debemos enviar el resumen hoy según la frecuencia configurada.
   */
  private static async shouldSendToday(frecuencia: string, diaSemana: number): Promise<boolean> {
    const now = new Date();
    const diaActual = now.getDay() === 0 ? 7 : now.getDay(); // Convertir domingo=0 a domingo=7

    switch (frecuencia) {
      case 'diario':
        return true;

      case 'cada_2_dias':
        // Calcular días desde el 1 de enero
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const diasTranscurridos = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        return diasTranscurridos % 2 === 0;

      case 'semanal':
        return diaActual === diaSemana;

      default:
        return true;
    }
  }

  /**
   * Construye el HTML del email de resumen diario.
   */
  private static buildSummaryHtml(fecha: string, metrics: DailyMetrics): string {
    const sinStockHtml = metrics.productosSinStock.length > 0
      ? metrics.productosSinStock.map(p => `<li style="margin:4px 0;color:#dc2626;">${p}</li>`).join('')
      : '<li style="color:#16a34a;">Todos los productos tienen stock</li>';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
  <div style="background:#fff;border-radius:8px;max-width:600px;margin:0 auto;padding:30px;">
    <div style="background:#0f49bd;color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center;margin:-30px -30px 20px;">
      <h2 style="margin:0;">Resumen Diario</h2>
      <p style="margin:5px 0 0;opacity:0.9;">${fecha}</p>
    </div>

    <!-- Métricas principales -->
    <div style="display:flex;gap:12px;margin-bottom:20px;">
      <div style="flex:1;background:#eff6ff;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#0f49bd;">${metrics.reservasHoy}</div>
        <div style="font-size:13px;color:#64748b;">Reservas nuevas</div>
      </div>
      <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#16a34a;">${metrics.ventasHoy}</div>
        <div style="font-size:13px;color:#64748b;">Ventas</div>
      </div>
      <div style="flex:1;background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#dc2626;">${metrics.cancelacionesHoy}</div>
        <div style="font-size:13px;color:#64748b;">Cancelaciones</div>
      </div>
    </div>

    <!-- Estado general -->
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;">
      <h3 style="margin:0 0 12px;color:#1e293b;">Estado general</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#64748b;">Reservas activas (pendientes de atención)</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;color:#1e293b;">${metrics.totalReservasActivas}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;">Vendedores activos</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;color:#1e293b;">${metrics.vendedoresActivos}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;">Reservas sin stock</td>
          <td style="padding:8px 0;text-align:right;font-weight:bold;color:${metrics.reservasSinStock > 0 ? '#dc2626' : '#16a34a'};">${metrics.reservasSinStock}</td>
        </tr>
      </table>
    </div>

    <!-- Productos sin stock -->
    <div style="background:#fef2f2;border-radius:8px;padding:16px;margin-bottom:20px;">
      <h3 style="margin:0 0 12px;color:#dc2626;">Productos sin stock</h3>
      <ul style="margin:0;padding-left:20px;">${sinStockHtml}</ul>
    </div>

    <div style="text-align:center;margin-top:20px;">
      <a href="${process.env.FRONTEND_URL || '#'}" 
         style="display:inline-block;background:#0f49bd;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Ver dashboard completo
      </a>
    </div>

    <div style="text-align:center;color:#999;font-size:12px;margin-top:20px;">
      Paguito Telcel — Resumen generado automáticamente
    </div>
  </div>
</body>
</html>`;
  }
}

export const dailySummaryService = new DailySummaryService();
