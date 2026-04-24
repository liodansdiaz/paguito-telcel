import { prisma } from '../../config/database';
import { NOTIFICATIONS_CONFIG } from '../../config/notifications';
import { emailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import { logger } from '../utils/logger';
import { CanalNotificacion, EstadoNotificacion } from '@prisma/client';
import { isWhatsappClienteEnabled, isWhatsappVendedorEnabled, getNotificacionesConfig } from './notificaciones-config.service';

interface StockAgotadoAlertData {
  reservationId: string;
  productId: string;
  productoNombre: string;
  clienteNombre: string;
  stockActual: number;
}

interface ItemDetalle {
  nombre: string;
  color?: string | null;
  memoria?: string | null;
  tipoPago: string;
}

interface ReservationNotificationData {
  reservationId: string;
  vendorEmail: string;
  vendorNombre: string;
  vendorTelefono?: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteCurp?: string;
  productoNombre: string;
  itemsDetalle: ItemDetalle[];
  tipoPago: string;
  direccion: string;
  fechaPreferida: Date;
  horarioPreferido: string;
  latitude?: number;
  longitude?: number;
}

interface ReservationCancellationData {
  reservationId: string;
  vendorNombre: string;
  vendorTelefono?: string;
  clienteNombre: string;
  clienteTelefono: string;
  itemsDetalle: ItemDetalle[];
  motivo?: string;
}

interface ReservationModificationData {
  reservationId: string;
  vendorNombre: string;
  vendorTelefono?: string;
  clienteNombre: string;
  clienteTelefono: string;
  itemsDetalle: ItemDetalle[];
  fechaAnterior: Date;
  fechaNueva: Date;
  horarioAnterior: string;
  horarioNuevo: string;
  direccionAnterior: string;
  direccionNueva: string;
  latitude?: number;
  longitude?: number;
}

interface PendingAssignmentNotificationData {
  reservationId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteCurp?: string;
  itemsDetalle: ItemDetalle[];
  direccion: string;
  fechaPreferida: Date;
  horarioPreferido: string;
  latitude?: number;
  longitude?: number;
}

interface ReassignmentNotificationData {
  reservationId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteCurp?: string;
  itemsDetalle: ItemDetalle[];
  direccion: string;
  fechaPreferida: Date;
  horarioPreferido: string;
  latitude?: number;
  longitude?: number;
  previousVendor: {
    nombre: string;
    telefono?: string;
  };
  newVendor: {
    nombre: string;
    email: string;
    telefono?: string;
  };
}

export class NotificationService {
  /**
   * Formatea los items de una reserva para mostrar en mensajes de WhatsApp.
   * Cada item muestra: nombre del producto, color, memoria y tipo de pago.
   */
  private static formatItems(items: ItemDetalle[]): string {
    return items.map(item => {
      const detalles = [item.nombre];
      if (item.color) detalles.push(`Color: ${item.color}`);
      if (item.memoria) detalles.push(`Almacenamiento: ${item.memoria}`);
      detalles.push(item.tipoPago === 'CREDITO' ? 'Crédito' : 'Contado');
      return `• ${detalles.join(' | ')}`;
    }).join('\n');
  }

  /**
   * Ejecuta todas las notificaciones configuradas para una nueva reserva.
   * La reserva ya fue guardada. Si falla la notificación, se registra el error
   * pero NO se revierte la reserva.
   */
  static async sendReservationNotification(data: ReservationNotificationData): Promise<void> {
    const notifConfig = await getNotificacionesConfig();
    const tasks: Promise<void>[] = [];

    if (notifConfig.email) {
      tasks.push(this.sendEmailNotification(data));
    }

    if (notifConfig.whatsappCliente || notifConfig.whatsappVendedor) {
      tasks.push(this.sendWhatsAppNotification(data));
    }

    if (notifConfig.internal) {
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

  /**
   * Notifica al vendedor y al cliente que una reserva fue cancelada.
   */
  static async sendCancellationNotification(data: ReservationCancellationData): Promise<void> {
    const waVendedorEnabled = await isWhatsappVendedorEnabled();
    const waClienteEnabled = await isWhatsappClienteEnabled();

    if (!waVendedorEnabled && !waClienteEnabled) return;

    const folio = data.reservationId.slice(0, 8).toUpperCase();
    const itemsFormateados = this.formatItems(data.itemsDetalle);

    const mensajeVendedor = [
      `🚫 *RESERVA CANCELADA*`,
      ``,
      `Hola ${data.vendorNombre}, se canceló una reserva asignada a ti.`,
      ``,
      `*Folio:* #${folio}`,
      ``,
      `📋 *DATOS:*`,
      `• *Cliente:* ${data.clienteNombre}`,
      `📦 *Producto(s):*`,
      itemsFormateados,
      data.motivo ? `\n• *Motivo:* ${data.motivo}` : '',
      ``,
      `No es necesario realizar la visita.`,
    ].filter(l => l !== '').join('\n');

    const mensajeCliente = [
      `✅ *RESERVA CANCELADA*`,
      ``,
      `Hola ${data.clienteNombre}, tu reserva ha sido cancelada exitosamente.`,
      ``,
      `*Folio:* #${folio}`,
      ``,
      `📦 *Producto(s) cancelados:*`,
      itemsFormateados,
      ``,
      `Si fue un error, puedes hacer una nueva reserva en cualquier momento.`,
    ].join('\n');

    const tasks: Promise<void>[] = [];

    if (data.vendorTelefono) {
      tasks.push(this.sendAndLogWhatsApp({
        reservationId: data.reservationId,
        numero: data.vendorTelefono,
        mensaje: mensajeVendedor,
        logMensaje: `WhatsApp cancelación a vendedor ${data.vendorNombre} (${data.vendorTelefono})`,
      }));
    }

    tasks.push(this.sendAndLogWhatsApp({
      reservationId: data.reservationId,
      numero: data.clienteTelefono,
      mensaje: mensajeCliente,
      logMensaje: `WhatsApp cancelación a cliente ${data.clienteNombre} (${data.clienteTelefono})`,
    }));

    await Promise.allSettled(tasks);
  }

  /**
   * Notifica al vendedor y al cliente que una reserva fue modificada.
   */
  static async sendModificationNotification(data: ReservationModificationData): Promise<void> {
    const waVendedorEnabled = await isWhatsappVendedorEnabled();
    const waClienteEnabled = await isWhatsappClienteEnabled();

    if (!waVendedorEnabled && !waClienteEnabled) return;

    const folio = data.reservationId.slice(0, 8).toUpperCase();
    const fmtFecha = (d: Date) => new Date(d).toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Detectar qué cambió
    const cambios: string[] = [];
    if (new Date(data.fechaAnterior).getTime() !== new Date(data.fechaNueva).getTime()) {
      cambios.push(`📅 Fecha: ${fmtFecha(data.fechaAnterior)} → ${fmtFecha(data.fechaNueva)}`);
    }
    if (data.horarioAnterior !== data.horarioNuevo) {
      cambios.push(`🕐 Horario: ${data.horarioAnterior} → ${data.horarioNuevo}`);
    }
    if (data.direccionAnterior !== data.direccionNueva) {
      cambios.push(`📍 Dirección: ${data.direccionNueva}`);
    }

    const cambiosTexto = cambios.join('\n');
    const itemsFormateados = this.formatItems(data.itemsDetalle);

    const hasCoords = data.latitude != null && data.longitude != null;
    const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}` : null;

    const mensajeVendedor = [
      `📝 *RESERVA MODIFICADA*`,
      ``,
      `Hola ${data.vendorNombre}, el cliente modificó una reserva asignada a ti.`,
      ``,
      `*Folio:* #${folio}`,
      `*Cliente:* ${data.clienteNombre}`,
      ``,
      `📦 *Producto(s):*`,
      itemsFormateados,
      ``,
      `*CAMBIOS REALIZADOS:*`,
      cambiosTexto,
      mapsUrl ? `\n🗺️ *NUEVA UBICACIÓN:* ${mapsUrl}` : '',
    ].filter(l => l !== '').join('\n');

    const mensajeCliente = [
      `✅ *RESERVA MODIFICADA*`,
      ``,
      `Hola ${data.clienteNombre}, tu reserva ha sido actualizada.`,
      ``,
      `*Folio:* #${folio}`,
      ``,
      `📦 *Producto(s):*`,
      itemsFormateados,
      ``,
      `*CAMBIOS:*`,
      cambiosTexto,
      ``,
      `El vendedor recibirá la notificación de los cambios.`,
    ].join('\n');

    const tasks: Promise<void>[] = [];

    if (data.vendorTelefono) {
      tasks.push(this.sendAndLogWhatsApp({
        reservationId: data.reservationId,
        numero: data.vendorTelefono,
        mensaje: mensajeVendedor,
        logMensaje: `WhatsApp modificación a vendedor ${data.vendorNombre} (${data.vendorTelefono})`,
      }));
    }

    tasks.push(this.sendAndLogWhatsApp({
      reservationId: data.reservationId,
      numero: data.clienteTelefono,
      mensaje: mensajeCliente,
      logMensaje: `WhatsApp modificación a cliente ${data.clienteNombre} (${data.clienteTelefono})`,
    }));

    await Promise.allSettled(tasks);
  }

  /**
   * Notifica a todos los admins activos que hay una nueva reserva
   * pendiente de asignación manual.
   */
  static async sendPendingAssignmentNotification(data: PendingAssignmentNotificationData): Promise<void> {
    // Obtener todos los admins activos
    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN', isActive: true },
      select: { email: true, nombre: true, telefono: true },
    });

    if (admins.length === 0) {
      logger.warn(`Reserva ${data.reservationId} pendiente de asignación pero no hay admins activos para notificar`);
      return;
    }

    const notifConfig = await getNotificacionesConfig();
    const tasks: Promise<void>[] = [];

    // Email a cada admin
    if (notifConfig.email) {
      admins.forEach((admin) => {
        tasks.push(this.sendPendingAssignmentEmail(data, admin.email, admin.nombre));
      });
    }

    // WhatsApp a cada admin que tenga teléfono configurado
    if (notifConfig.whatsappVendedor) {
      // Usar el mismo flag que vendedores para admins
      admins
        .filter((admin) => admin.telefono)
        .forEach((admin) => {
          tasks.push(this.sendPendingAssignmentWhatsApp(data, admin.telefono!, admin.nombre));
        });
    }

    // Ejecutar todas en paralelo
    const results = await Promise.allSettled(tasks);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(
          `Notificación pendiente de asignación ${index} falló para reserva ${data.reservationId}:`,
          result.reason
        );
      }
    });
  }

  /**
   * Envía email a un admin notificando reserva pendiente de asignación
   */
  private static async sendPendingAssignmentEmail(
    data: PendingAssignmentNotificationData,
    adminEmail: string,
    adminNombre: string
  ): Promise<void> {
    let logId: string | undefined;
    try {
      const log = await prisma.notification.create({
        data: {
          reservationId: data.reservationId,
          canal: CanalNotificacion.EMAIL,
          status: EstadoNotificacion.PENDING,
          mensaje: `Email pendiente asignación a admin ${adminEmail}`,
        },
      });
      logId = log.id;

      await emailService.send({
        to: adminEmail,
        subject: `⚠️ Reserva Pendiente de Asignación — ${data.clienteNombre}`,
        html: this.buildPendingAssignmentEmailHtml(data, adminNombre),
      });

      await prisma.notification.update({
        where: { id: logId },
        data: { status: EstadoNotificacion.SENT, sentAt: new Date() },
      });

      logger.info(`Email pendiente asignación enviado a admin ${adminEmail} para reserva ${data.reservationId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (logId) {
        await prisma.notification
          .update({
            where: { id: logId },
            data: { status: EstadoNotificacion.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }
      logger.error(`Error enviando email pendiente asignación a admin ${adminEmail}:`, err);
      throw err;
    }
  }

  /**
   * Construye el HTML del email para notificación de asignación pendiente
   */
  private static buildPendingAssignmentEmailHtml(
    data: PendingAssignmentNotificationData,
    adminNombre: string
  ): string {
    const fecha = new Date(data.fechaPreferida).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const folio = data.reservationId.slice(0, 8).toUpperCase();
    const hasCoords = data.latitude != null && data.longitude != null;
    const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}` : null;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const itemsHtml = data.itemsDetalle
      .map((item) => {
        const detalles = [item.nombre];
        if (item.color) detalles.push(`Color: ${item.color}`);
        if (item.memoria) detalles.push(`Almacenamiento: ${item.memoria}`);
        detalles.push(item.tipoPago === 'CREDITO' ? 'Crédito' : 'Contado');
        return `<li>${detalles.join(' | ')}</li>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { background: #fff; border-radius: 8px; max-width: 600px; margin: 0 auto; padding: 30px; }
    .header { background: #f59e0b; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -30px -30px 20px; }
    .badge { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
    .alert-box { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin: 20px 0; color: #92400e; }
    .field { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #f59e0b; }
    .field strong { color: #92400e; }
    .btn { display: inline-block; background: #0f49bd; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px; }
    .map-btn { display: inline-block; background: #13ec6d; color: #002f87; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
    ul { list-style: none; padding: 0; }
    ul li { padding: 8px; background: #f8f9fa; margin: 5px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ Reserva Pendiente de Asignación</h2>
      <span class="badge">Folio: #${folio}</span>
    </div>

    <p>Estimado/a <strong>${adminNombre}</strong>,</p>

    <div class="alert-box">
      <strong>Acción requerida:</strong> Se ha recibido una nueva reserva que requiere asignación manual de vendedor. 
      Por favor ingrese al sistema para asignar un vendedor lo antes posible.
    </div>

    <h3 style="color: #92400e; margin-top: 20px;">Datos del Cliente</h3>
    <div class="field"><strong>Nombre:</strong> ${data.clienteNombre}</div>
    <div class="field"><strong>Teléfono:</strong> ${data.clienteTelefono}</div>
    ${data.clienteCurp ? `<div class="field"><strong>CURP:</strong> ${data.clienteCurp}</div>` : ''}
    <div class="field"><strong>Dirección:</strong> ${data.direccion}</div>

    <h3 style="color: #92400e; margin-top: 20px;">Producto(s) Reservado(s)</h3>
    <ul>${itemsHtml}</ul>

    <h3 style="color: #92400e; margin-top: 20px;">Fecha y Horario Solicitado</h3>
    <div class="field"><strong>Fecha preferida:</strong> ${fecha}</div>
    <div class="field"><strong>Horario preferido:</strong> ${data.horarioPreferido}</div>

    ${
      hasCoords
        ? `
    <h3 style="color: #92400e; margin-top: 20px;">Ubicación GPS</h3>
    <div class="field">
      <strong>Coordenadas:</strong><br>
      Latitud: ${data.latitude}<br>
      Longitud: ${data.longitude}
    </div>
    <a href="${mapsUrl}" class="map-btn">📍 Ver ubicación en Google Maps</a>
    `
        : `
    <div class="field">
      <strong>Ubicación GPS:</strong> No proporcionada
    </div>
    `
    }

    <div style="text-align: center; margin-top: 30px;">
      <a href="${frontendUrl}/admin/reservas" class="btn">Ir al Panel de Asignación</a>
    </div>

    <div class="footer">
      <p>Amigos Paguito Telcel — Sistema de Reservas</p>
      <p style="color: #92400e; font-size: 11px;">
        Este mensaje se envía porque la configuración de asignación está en modo manual.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Envía WhatsApp a un admin notificando reserva pendiente de asignación
   */
  private static async sendPendingAssignmentWhatsApp(
    data: PendingAssignmentNotificationData,
    adminTelefono: string,
    adminNombre: string
  ): Promise<void> {
    const fecha = new Date(data.fechaPreferida).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const folio = data.reservationId.slice(0, 8).toUpperCase();
    const hasCoords = data.latitude != null && data.longitude != null;
    const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}` : null;
    const itemsFormateados = this.formatItems(data.itemsDetalle);

    const mensaje = [
      `⚠️ *RESERVA PENDIENTE DE ASIGNACIÓN*`,
      ``,
      `Hola ${adminNombre}, se recibió una nueva reserva que requiere asignación manual de vendedor.`,
      ``,
      `*Folio:* #${folio}`,
      ``,
      `*DATOS DEL CLIENTE:*`,
      `• *Nombre:* ${data.clienteNombre}`,
      `• *Teléfono:* ${data.clienteTelefono}`,
      data.clienteCurp ? `• *CURP:* ${data.clienteCurp}` : null,
      `• *Dirección:* ${data.direccion}`,
      ``,
      `*PRODUCTO(S):*`,
      itemsFormateados,
      ``,
      `*FECHA PREFERIDA:* ${fecha}`,
      `*HORARIO:* ${data.horarioPreferido}`,
      mapsUrl ? `\n*UBICACIÓN GPS:* ${mapsUrl}` : '',
      ``,
      `Por favor, ingresa al panel de administración para asignar un vendedor lo antes posible.`,
    ]
      .filter((line) => line !== null)
      .join('\n');

    await this.sendAndLogWhatsApp({
      reservationId: data.reservationId,
      numero: adminTelefono,
      mensaje,
      logMensaje: `WhatsApp pendiente asignación a admin ${adminNombre} (${adminTelefono})`,
    });
  }

  /**
   * Notifica al vendedor anterior y al nuevo vendedor cuando se reasigna una reserva.
   */
  static async sendReassignmentNotification(data: ReassignmentNotificationData): Promise<void> {
    const notifConfig = await getNotificacionesConfig();
    const tasks: Promise<void>[] = [];

    // Notificar al vendedor anterior (le quitaron la reserva)
    if (notifConfig.whatsappVendedor && data.previousVendor.telefono) {
      tasks.push(this.sendReassignmentWhatsAppToPrevious(data));
    }

    // Notificar al nuevo vendedor (le asignaron la reserva)
    if (notifConfig.email) {
      tasks.push(this.sendReassignmentEmailToNew(data));
    }

    if (notifConfig.whatsappVendedor && data.newVendor.telefono) {
      tasks.push(this.sendReassignmentWhatsAppToNew(data));
    }

    // Ejecutar todas en paralelo
    const results = await Promise.allSettled(tasks);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(
          `Notificación de reasignación ${index} falló para reserva ${data.reservationId}:`,
          result.reason
        );
      }
    });
  }

  /**
   * Envía WhatsApp al vendedor anterior informando que le quitaron la reserva
   */
  private static async sendReassignmentWhatsAppToPrevious(data: ReassignmentNotificationData): Promise<void> {
    const folio = data.reservationId.slice(0, 8).toUpperCase();
    const itemsFormateados = this.formatItems(data.itemsDetalle);

    const mensaje = [
      `⚠️ *RESERVA REASIGNADA*`,
      ``,
      `Hola ${data.previousVendor.nombre}, la siguiente reserva ya no está asignada a ti:`,
      ``,
      `*Folio:* #${folio}`,
      `*Cliente:* ${data.clienteNombre}`,
      ``,
      `*PRODUCTO(S):*`,
      itemsFormateados,
      ``,
      `Un administrador reasignó esta reserva a otro vendedor.`,
      ``,
      `No es necesario que realices la visita.`,
    ].join('\n');

    await this.sendAndLogWhatsApp({
      reservationId: data.reservationId,
      numero: data.previousVendor.telefono!,
      mensaje,
      logMensaje: `WhatsApp reasignación (anterior) a ${data.previousVendor.nombre} (${data.previousVendor.telefono})`,
    });
  }

  /**
   * Envía email al nuevo vendedor con los datos completos de la reserva
   */
  private static async sendReassignmentEmailToNew(data: ReassignmentNotificationData): Promise<void> {
    let logId: string | undefined;
    try {
      const log = await prisma.notification.create({
        data: {
          reservationId: data.reservationId,
          canal: CanalNotificacion.EMAIL,
          status: EstadoNotificacion.PENDING,
          mensaje: `Email reasignación a ${data.newVendor.email}`,
        },
      });
      logId = log.id;

      await emailService.send({
        to: data.newVendor.email,
        subject: `Nueva Reserva Asignada — ${data.clienteNombre} | ${data.itemsDetalle[0]?.nombre || 'Producto'}`,
        html: this.buildReassignmentEmailHtml(data),
      });

      await prisma.notification.update({
        where: { id: logId },
        data: { status: EstadoNotificacion.SENT, sentAt: new Date() },
      });

      logger.info(`Email reasignación enviado a ${data.newVendor.email} para reserva ${data.reservationId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (logId) {
        await prisma.notification
          .update({
            where: { id: logId },
            data: { status: EstadoNotificacion.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }
      logger.error(`Error enviando email reasignación a ${data.newVendor.email}:`, err);
      throw err;
    }
  }

  /**
   * Construye el HTML del email para notificación de reasignación al nuevo vendedor
   */
  private static buildReassignmentEmailHtml(data: ReassignmentNotificationData): string {
    const fecha = new Date(data.fechaPreferida).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const folio = data.reservationId.slice(0, 8).toUpperCase();
    const hasCoords = data.latitude != null && data.longitude != null;
    const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}` : null;
    const itemsHtml = data.itemsDetalle
      .map((item) => {
        const detalles = [item.nombre];
        if (item.color) detalles.push(`Color: ${item.color}`);
        if (item.memoria) detalles.push(`Almacenamiento: ${item.memoria}`);
        detalles.push(item.tipoPago === 'CREDITO' ? 'Crédito' : 'Contado');
        return `<li>${detalles.join(' | ')}</li>`;
      })
      .join('');

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
    .alert-box { background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 6px; padding: 15px; margin: 20px 0; color: #075985; }
    .field { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #0f49bd; }
    .field strong { color: #002f87; }
    .map-btn { display: inline-block; background: #13ec6d; color: #002f87; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
    ul { list-style: none; padding: 0; }
    ul li { padding: 8px; background: #f8f9fa; margin: 5px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Nueva Reserva Asignada</h2>
      <span class="badge">ID: #${folio}</span>
    </div>

    <p>Hola <strong>${data.newVendor.nombre}</strong>,</p>

    <div class="alert-box">
      <strong>ℹ️ Reasignación:</strong> Esta reserva fue reasignada desde ${data.previousVendor.nombre} hacia ti.
    </div>

    <h3 style="color: #002f87; margin-top: 20px;">Datos del Cliente</h3>
    <div class="field"><strong>Nombre:</strong> ${data.clienteNombre}</div>
    <div class="field"><strong>Teléfono:</strong> ${data.clienteTelefono}</div>
    ${data.clienteCurp ? `<div class="field"><strong>CURP:</strong> ${data.clienteCurp}</div>` : ''}
    <div class="field"><strong>Dirección:</strong> ${data.direccion}</div>

    <h3 style="color: #002f87; margin-top: 20px;">Producto(s) Reservado(s)</h3>
    <ul>${itemsHtml}</ul>

    <h3 style="color: #002f87; margin-top: 20px;">Fecha y Horario</h3>
    <div class="field"><strong>Fecha preferida:</strong> ${fecha}</div>
    <div class="field"><strong>Horario preferido:</strong> ${data.horarioPreferido}</div>

    ${
      hasCoords
        ? `
    <h3 style="color: #002f87; margin-top: 20px;">Ubicación GPS</h3>
    <div class="field">
      <strong>Coordenadas:</strong><br>
      Latitud: ${data.latitude}<br>
      Longitud: ${data.longitude}
    </div>
    <a href="${mapsUrl}" class="map-btn">📍 Ver ubicación en Google Maps</a>
    `
        : `
    <div class="field">
      <strong>Ubicación GPS:</strong> No proporcionada
    </div>
    `
    }

    <div class="footer">
      <p>Amigos Paguito Telcel — Sistema de Reservas</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Envía WhatsApp al nuevo vendedor con los datos de la reserva
   */
  private static async sendReassignmentWhatsAppToNew(data: ReassignmentNotificationData): Promise<void> {
    const fecha = new Date(data.fechaPreferida).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const folio = data.reservationId.slice(0, 8).toUpperCase();
    const hasCoords = data.latitude != null && data.longitude != null;
    const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}` : null;
    const itemsFormateados = this.formatItems(data.itemsDetalle);

    const mensaje = [
      `📋 *NUEVA RESERVA ASIGNADA*`,
      ``,
      `Hola ${data.newVendor.nombre}, se te asignó una reserva:`,
      ``,
      `*Folio:* #${folio}`,
      ``,
      `ℹ️ Esta reserva fue reasignada desde ${data.previousVendor.nombre}`,
      ``,
      `*DATOS DEL CLIENTE:*`,
      `• *Nombre:* ${data.clienteNombre}`,
      `• *Teléfono:* ${data.clienteTelefono}`,
      data.clienteCurp ? `• *CURP:* ${data.clienteCurp}` : null,
      `• *Dirección:* ${data.direccion}`,
      ``,
      `*PRODUCTO(S):*`,
      itemsFormateados,
      ``,
      `*FECHA PREFERIDA:* ${fecha}`,
      `*HORARIO:* ${data.horarioPreferido}`,
      mapsUrl ? `\n*UBICACIÓN GPS:* ${mapsUrl}` : '',
      ``,
      `Ingresa al sistema para ver más detalles.`,
    ]
      .filter((line) => line !== null)
      .join('\n');

    await this.sendAndLogWhatsApp({
      reservationId: data.reservationId,
      numero: data.newVendor.telefono!,
      mensaje,
      logMensaje: `WhatsApp reasignación (nuevo) a ${data.newVendor.nombre} (${data.newVendor.telefono})`,
    });
  }

  /**
   * Helper: envía un WhatsApp y guarda el log en BD (PENDING → SENT/FAILED).
   */
  private static async sendAndLogWhatsApp(opts: {
    reservationId: string;
    numero: string;
    mensaje: string;
    logMensaje: string;
  }): Promise<void> {
    let logId: string | undefined;
    try {
      const log = await prisma.notification.create({
        data: {
          reservationId: opts.reservationId,
          canal: CanalNotificacion.WHATSAPP,
          status: EstadoNotificacion.PENDING,
          mensaje: opts.logMensaje,
        },
      });
      logId = log.id;

      await whatsappService.send({ numero: opts.numero, mensaje: opts.mensaje });

      await prisma.notification.update({
        where: { id: logId },
        data: { status: EstadoNotificacion.SENT, sentAt: new Date() },
      });

      logger.info(opts.logMensaje);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (logId) {
        await prisma.notification.update({
          where: { id: logId },
          data: { status: EstadoNotificacion.FAILED, error: errorMsg },
        }).catch(() => {});
      }
      logger.error(`Error en ${opts.logMensaje}:`, err);
      throw err;
    }
  }

  private static buildEmailHtml(data: ReservationNotificationData): string {
    const fecha = new Date(data.fechaPreferida).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const hasCoords = data.latitude != null && data.longitude != null;
    const mapsUrl = hasCoords 
      ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
      : null;

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
    ${data.clienteCurp ? `<div class="field"><strong>CURP:</strong> ${data.clienteCurp}</div>` : ''}
    <div class="field"><strong>Modelo:</strong> ${data.productoNombre}</div>
    <div class="field"><strong>Tipo de pago:</strong> ${data.tipoPago === 'CONTADO' ? 'Contado' : 'Crédito'}</div>
    <div class="field"><strong>Dirección:</strong> ${data.direccion}</div>
    <div class="field"><strong>Fecha preferida:</strong> ${fecha}</div>
    <div class="field"><strong>Horario preferido:</strong> ${data.horarioPreferido}</div>

    ${hasCoords ? `
    <div class="field">
      <strong>Ubicación GPS:</strong><br>
      Latitud: ${data.latitude}<br>
      Longitud: ${data.longitude}
    </div>

    <a href="${mapsUrl}" class="map-btn">Ver en Google Maps</a>
    ` : `
    <div class="field">
      <strong>Ubicación GPS:</strong> No proporcionada
    </div>
    `}

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

  /**
   * Envía WhatsApp a vendedor y cliente según la configuración.
   * Este método lee la configuración cada vez para tomar decisiones en tiempo real.
   */
  private static async sendWhatsAppNotification(data: ReservationNotificationData): Promise<void> {
    // Leer configuración actualizada desde DB
    const config = await getNotificacionesConfig();
    const enviarAVendedor = config.whatsappVendedor;
    const enviarACliente = config.whatsappCliente;

    console.log('📱 sendWhatsAppNotification - Config:', { enviarAVendedor, enviarACliente });

    // Si ambos están deshabilitados, salir temprano
    if (!enviarAVendedor && !enviarACliente) {
      console.log('📱 WhatsApp deshabilitado para ambos - no se envía');
      return;
    }

    const fecha = new Date(data.fechaPreferida).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const folio = data.reservationId.slice(0, 8).toUpperCase();
    const hasCoords = data.latitude != null && data.longitude != null;
    const mapsUrl = hasCoords
      ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
      : null;

    // --- Mensaje para el VENDEDOR ---
    const itemsFormateados = this.formatItems(data.itemsDetalle);

    const mensajeVendedor = [
      `*NUEVA RESERVA ASIGNADA*`,
      ``,
      `Hola ${data.vendorNombre}, se te ha asignado una nueva reserva.`,
      ``,
      `*Folio:* #${folio}`,
      ``,
      `*DATOS DEL CLIENTE:*`,
      `* Nombre:* ${data.clienteNombre}`,
      `* Telefono:* ${data.clienteTelefono}`,
      data.clienteCurp ? `* CURP:* ${data.clienteCurp}` : null,
      `* Direccion:* ${data.direccion}`,
      ``,
      `*PRODUCTO(S):*`,
      itemsFormateados,
      ``,
      `*FECHA PREFERIDA:* ${fecha}`,
      `*HORARIO:* ${data.horarioPreferido}`,
      mapsUrl ? `\n*UBICACION GPS:* ${mapsUrl}` : '',
      ``,
      `Ingresa al sistema para ver mas detalles.`,
    ].filter(line => line !== null).join('\n');

    // --- Mensaje para el CLIENTE ---
    const mensajeCliente = [
      `*RESERVA CONFIRMADA*`,
      ``,
      `Hola ${data.clienteNombre}, tu reserva se realizo con exito.`,
      ``,
      `*Folio:* #${folio}`,
      ``,
      `*PRODUCTO(S) RESERVADO(S):*`,
      itemsFormateados,
      ``,
      `*FECHA PREFERIDA:* ${fecha}`,
      `*HORARIO:* ${data.horarioPreferido}`,
      ``,
      `Un vendedor se pondra en contacto contigo pronto para confirmar tu visita.`,
      ``,
      `Si necesitas cancelar, ingresa al sistema con tu folio o CURP.`,
    ].join('\n');

    // Enviar notificaciones según configuración
    const tasks: Promise<void>[] = [];

    // WhatsApp al vendedor (solo si está habilitado)
    if (enviarAVendedor && data.vendorTelefono) {
      const taskVendedor = (async () => {
        let logId: string | undefined;
        try {
          const log = await prisma.notification.create({
            data: {
              reservationId: data.reservationId,
              canal: CanalNotificacion.WHATSAPP,
              status: EstadoNotificacion.PENDING,
              mensaje: `WhatsApp a vendedor ${data.vendorNombre} (${data.vendorTelefono})`,
            },
          });
          logId = log.id;

          await whatsappService.send({
            numero: data.vendorTelefono!,
            mensaje: mensajeVendedor,
          });

          await prisma.notification.update({
            where: { id: logId },
            data: { status: EstadoNotificacion.SENT, sentAt: new Date() },
          });

          logger.info(`WhatsApp enviado al vendedor ${data.vendorNombre} para reserva ${data.reservationId}`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          if (logId) {
            await prisma.notification.update({
              where: { id: logId },
              data: { status: EstadoNotificacion.FAILED, error: errorMsg },
            }).catch(() => {});
          }
          logger.error(`Error enviando WhatsApp al vendedor para reserva ${data.reservationId}:`, err);
          throw err;
        }
      })();
      tasks.push(taskVendedor);
    } else if (!enviarAVendedor) {
      logger.info(`WhatsApp al vendedor deshabilitado - no se enviara para reserva ${data.reservationId}`);
    } else if (!data.vendorTelefono) {
      logger.warn(`Vendedor ${data.vendorNombre} no tiene teléfono configurado - no se puede enviar WhatsApp para reserva ${data.reservationId}`);
    }

    // WhatsApp al cliente (solo si está habilitado)
    if (enviarACliente) {
      const taskCliente = (async () => {
        let logId: string | undefined;
        try {
          const log = await prisma.notification.create({
            data: {
              reservationId: data.reservationId,
              canal: CanalNotificacion.WHATSAPP,
              status: EstadoNotificacion.PENDING,
              mensaje: `WhatsApp a cliente ${data.clienteNombre} (${data.clienteTelefono})`,
            },
          });
          logId = log.id;

          await whatsappService.send({
            numero: data.clienteTelefono,
            mensaje: mensajeCliente,
          });

          await prisma.notification.update({
            where: { id: logId },
            data: { status: EstadoNotificacion.SENT, sentAt: new Date() },
          });

          logger.info(`WhatsApp enviado al cliente ${data.clienteNombre} para reserva ${data.reservationId}`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          if (logId) {
            await prisma.notification.update({
              where: { id: logId },
              data: { status: EstadoNotificacion.FAILED, error: errorMsg },
            }).catch(() => {});
          }
          logger.error(`Error enviando WhatsApp al cliente para reserva ${data.reservationId}:`, err);
          throw err;
        }
      })();
      tasks.push(taskCliente);
    } else {
      logger.info(`WhatsApp al cliente deshabilitado - no se enviara para reserva ${data.reservationId}`);
    }

    await Promise.allSettled(tasks);
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
    const hasCoords = data.latitude != null && data.longitude != null;
    const mapsUrl = hasCoords 
      ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
      : 'No disponible';
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
