import { prisma } from '../../config/database';
import { NOTIFICATIONS_CONFIG } from '../../config/notifications';
import { emailService } from './email.service';
import { logger } from '../utils/logger';
import { CanalNotificacion, EstadoNotificacion } from '@prisma/client';

interface StockAgotadoAlertData {
  reservationId: string;
  productId: string;
  productoNombre: string;
  clienteNombre: string;
  stockActual: number;
}

interface ReservationNotificationData {
  reservationId: string;
  vendorEmail: string;
  vendorNombre: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteCurp: string;
  productoNombre: string;
  tipoPago: string;
  direccion: string;
  fechaPreferida: Date;
  horarioPreferido: string;
  latitude?: number;
  longitude?: number;
}

export class NotificationService {
  /**
   * Ejecuta todas las notificaciones configuradas para una nueva reserva.
   * La reserva ya fue guardada. Si falla la notificación, se registra el error
   * pero NO se revierte la reserva.
   */
  static async sendReservationNotification(data: ReservationNotificationData): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (NOTIFICATIONS_CONFIG.email) {
      tasks.push(this.sendEmailNotification(data));
    }

    if (NOTIFICATIONS_CONFIG.whatsapp) {
      tasks.push(this.sendWhatsAppNotification(data));
    }

    if (NOTIFICATIONS_CONFIG.internal) {
      tasks.push(this.saveInternalNotification(data));
    }

    // Ejecutar todas en paralelo — errores individuales no bloquean
    const results = await Promise.allSettled(tasks);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Notificación ${index} falló para reserva ${data.reservationId}:`, result.reason);
      }
    });
  }

  private static buildEmailHtml(data: ReservationNotificationData): string {
    const fecha = new Date(data.fechaPreferida).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const mapsUrl = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { background: #fff; border-radius: 8px; max-width: 600px; margin: 0 auto; padding: 30px; }
    .header { background: #0f49bd; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -30px -30px 20px; }
    .badge { background: #13ec6d; color: #002f87; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
    .field { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #0f49bd; }
    .field strong { color: #002f87; }
    .map-btn { display: inline-block; background: #13ec6d; color: #002f87; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Nueva Reserva Asignada</h2>
      <span class="badge">ID: #${data.reservationId.slice(0, 8).toUpperCase()}</span>
    </div>

    <p>Hola <strong>${data.vendorNombre}</strong>, tienes una nueva reserva asignada:</p>

    <div class="field"><strong>Cliente:</strong> ${data.clienteNombre}</div>
    <div class="field"><strong>Teléfono:</strong> ${data.clienteTelefono}</div>
    <div class="field"><strong>CURP:</strong> ${data.clienteCurp}</div>
    <div class="field"><strong>Modelo:</strong> ${data.productoNombre}</div>
    <div class="field"><strong>Tipo de pago:</strong> ${data.tipoPago === 'CONTADO' ? 'Contado' : 'Crédito'}</div>
    <div class="field"><strong>Dirección:</strong> ${data.direccion}</div>
    <div class="field"><strong>Fecha preferida:</strong> ${fecha}</div>
    <div class="field"><strong>Horario preferido:</strong> ${data.horarioPreferido}</div>

    <div class="field">
      <strong>Ubicación GPS:</strong><br>
      Latitud: ${data.latitude}<br>
      Longitud: ${data.longitude}
    </div>

    <a href="${mapsUrl}" class="map-btn">Ver en Google Maps</a>

    <div class="footer">
      <p>Amigos Paguito Telcel — Sistema de Reservas</p>
    </div>
  </div>
</body>
</html>`;
  }

  private static async sendEmailNotification(data: ReservationNotificationData): Promise<void> {
    let logId: string | undefined;
    try {
      const log = await prisma.notification.create({
        data: {
          reservationId: data.reservationId,
          canal: CanalNotificacion.EMAIL,
          status: EstadoNotificacion.PENDING,
          mensaje: `Email a ${data.vendorEmail}`,
        },
      });
      logId = log.id;

      await emailService.send({
        to: data.vendorEmail,
        subject: `Nueva Reserva Asignada — ${data.clienteNombre} | ${data.productoNombre}`,
        html: this.buildEmailHtml(data),
      });

      await prisma.notification.update({
        where: { id: logId },
        data: { status: EstadoNotificacion.SENT, sentAt: new Date() },
      });

      logger.info(`Email enviado a ${data.vendorEmail} para reserva ${data.reservationId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (logId) {
        await prisma.notification.update({
          where: { id: logId },
          data: { status: EstadoNotificacion.FAILED, error: errorMsg },
        }).catch(() => {});
      }
      logger.error(`Error enviando email para reserva ${data.reservationId}:`, err);
      throw err;
    }
  }

  private static async sendWhatsAppNotification(data: ReservationNotificationData): Promise<void> {
    // ESTRUCTURA PREPARADA — Canal desactivado en NOTIFICATIONS_CONFIG
    // TODO: Integrar con Twilio / WhatsApp Business API
    logger.info(`WhatsApp (pendiente): reserva ${data.reservationId} para ${data.vendorNombre}`);

    await prisma.notification.create({
      data: {
        reservationId: data.reservationId,
        canal: CanalNotificacion.WHATSAPP,
        status: EstadoNotificacion.PENDING,
        mensaje: 'Canal WhatsApp no configurado aún',
      },
    });
  }

  /**
   * Envía una alerta a todos los admins activos cuando se crea una reserva
   * con stock en 0. El negocio debe intentar conseguir el producto.
   */
  static async sendStockAgotadoAlert(data: StockAgotadoAlertData): Promise<void> {
    // Obtener todos los admins activos
    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN', isActive: true },
      select: { email: true, nombre: true },
    });

    if (admins.length === 0) {
      logger.warn(`Stock agotado en reserva ${data.reservationId} pero no hay admins activos para notificar`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const folio = data.reservationId.slice(0, 8).toUpperCase();

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { background: #fff; border-radius: 8px; max-width: 600px; margin: 0 auto; padding: 30px; }
    .header { background: #dc2626; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -30px -30px 20px; }
    .badge { background: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; border: 1px solid #fca5a5; }
    .field { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #dc2626; }
    .field strong { color: #7f1d1d; }
    .alert-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 15px; margin: 20px 0; }
    .btn { display: inline-block; background: #0f49bd; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ Alerta: Reserva con Stock Agotado</h2>
      <span class="badge">Folio: #${folio}</span>
    </div>

    <div class="alert-box">
      <strong>Se ha creado una reserva para un producto sin stock disponible.</strong><br>
      Es necesario conseguir el producto o contactar al cliente para informarle.
    </div>

    <div class="field"><strong>Producto:</strong> ${data.productoNombre}</div>
    <div class="field"><strong>Stock actual:</strong> ${data.stockActual} unidades</div>
    <div class="field"><strong>Cliente que reservó:</strong> ${data.clienteNombre}</div>
    <div class="field"><strong>Folio de reserva:</strong> #${folio}</div>

    <a href="${frontendUrl}/admin/reservas" class="btn">Ver reserva en el sistema</a>

    <div class="footer">
      <p>Amigos Paguito Telcel — Sistema de Reservas</p>
    </div>
  </div>
</body>
</html>`;

    // Enviar email a cada admin en paralelo
    const emailTasks = admins.map(async (admin) => {
      let logId: string | undefined;
      try {
        const log = await prisma.notification.create({
          data: {
            reservationId: data.reservationId,
            canal: CanalNotificacion.EMAIL,
            status: EstadoNotificacion.PENDING,
            mensaje: `Alerta stock agotado a admin ${admin.email} — ${data.productoNombre}`,
          },
        });
        logId = log.id;

        await emailService.send({
          to: admin.email,
          subject: `⚠️ Stock agotado — ${data.productoNombre} | Reserva #${folio}`,
          html,
        });

        await prisma.notification.update({
          where: { id: logId },
          data: { status: EstadoNotificacion.SENT, sentAt: new Date() },
        });

        logger.info(`Alerta stock agotado enviada a admin ${admin.email} para reserva ${data.reservationId}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (logId) {
          await prisma.notification.update({
            where: { id: logId },
            data: { status: EstadoNotificacion.FAILED, error: errorMsg },
          }).catch(() => {});
        }
        logger.error(`Error enviando alerta stock agotado a ${admin.email}:`, err);
      }
    });

    // Notificación interna de auditoría
    const internalTask = prisma.notification.create({
      data: {
        reservationId: data.reservationId,
        canal: CanalNotificacion.INTERNAL,
        status: EstadoNotificacion.SENT,
        mensaje: `Alerta stock agotado: ${data.productoNombre} (stock: ${data.stockActual}) — Cliente: ${data.clienteNombre} — Folio: #${folio}`,
        sentAt: new Date(),
      },
    }).catch((err) => logger.error('Error guardando notificación interna de stock agotado:', err));

    await Promise.allSettled([...emailTasks, internalTask]);
  }

  private static async saveInternalNotification(data: ReservationNotificationData): Promise<void> {
    const mapsUrl = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
    const mensaje = `Nueva reserva #${data.reservationId.slice(0, 8).toUpperCase()} — Cliente: ${data.clienteNombre} — Producto: ${data.productoNombre} — Maps: ${mapsUrl}`;

    await prisma.notification.create({
      data: {
        reservationId: data.reservationId,
        canal: CanalNotificacion.INTERNAL,
        status: EstadoNotificacion.SENT,
        mensaje,
        sentAt: new Date(),
      },
    });

    logger.info(`Notificación interna guardada para reserva ${data.reservationId}`);
  }
}
