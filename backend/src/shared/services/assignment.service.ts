import { prisma } from '../../config/database';
import { RoundRobinService } from './roundrobin.service';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';
import { EstrategiaAsignacion } from '@prisma/client';

/**
 * Servicio de asignación de vendedores a reservas
 * 
 * Soporta múltiples estrategias configurables:
 * - ROUND_ROBIN: Asignación automática al vendedor menos recientemente asignado
 * - MANUAL: Sin asignación automática, el admin asigna manualmente
 */
export class AssignmentService {
  // Cache para evitar leer DB en cada asignación
  private estrategiaCache: EstrategiaAsignacion | null = null;
  private cacheExpiry: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Asigna un vendedor a una reserva según la estrategia configurada.
   * 
   * @param reservationId - ID de la reserva a asignar
   * @returns ID del vendedor asignado, o null si la estrategia es MANUAL
   */
  async assignVendor(reservationId: string): Promise<string | null> {
    const estrategia = await this.getEstrategiaActiva();

    if (estrategia === 'ROUND_ROBIN') {
      const vendorId = await RoundRobinService.getNextVendor();

      // Actualizar reserva
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          vendorId,
          estado: 'ASIGNADA',
          motivoAsignacion: 'Asignación automática (Round Robin)',
        },
      });

      logger.info(`Reserva ${reservationId} asignada automáticamente a vendedor ${vendorId} (Round Robin)`);

      return vendorId;
    }

    if (estrategia === 'MANUAL') {
      // No asigna, deja la reserva en estado NUEVA
      logger.info(`Reserva ${reservationId} creada sin asignar (modo Manual)`);

      // Notificar a admins que hay una reserva pendiente de asignación
      await this.notifyAdminsOfPendingAssignment(reservationId);

      return null;
    }

    throw new Error(`Estrategia de asignación no válida: ${estrategia}`);
  }

  /**
   * Asigna manualmente un vendedor a una reserva (solo admins).
   * 
   * @param reservationId - ID de la reserva
   * @param vendorId - ID del vendedor a asignar
   * @param adminId - ID del admin que realiza la asignación
   */
  async assignManually(reservationId: string, vendorId: string, adminId: string): Promise<void> {
    // Obtener reserva actual con todos los datos
    const currentReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        vendor: {
          select: { id: true, nombre: true, telefono: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!currentReservation) {
      throw new Error(`Reserva ${reservationId} no encontrada`);
    }

    const previousVendorId = currentReservation.vendorId;

    // Obtener datos del admin y nuevo vendedor
    const [admin, newVendor] = await Promise.all([
      prisma.user.findUnique({
        where: { id: adminId },
        select: { nombre: true },
      }),
      prisma.user.findUnique({
        where: { id: vendorId },
        select: { id: true, nombre: true, email: true, telefono: true },
      }),
    ]);

    if (!newVendor) {
      throw new Error(`Vendedor ${vendorId} no encontrado`);
    }

    // Actualizar reserva
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        vendorId,
        estado: 'ASIGNADA',
        motivoAsignacion: `Asignación manual por ${admin?.nombre || 'Admin'}`,
        asignadoManualmentePor: adminId,
      },
    });

    logger.info(`Reserva ${reservationId} asignada manualmente a vendedor ${vendorId} por admin ${adminId}`);

    // Notificaciones según el tipo de asignación
    const itemsDetalle = currentReservation.items.map((item) => ({
      nombre: item.product?.nombre ?? 'Producto desconocido',
      color: item.color,
      memoria: item.memoria,
      tipoPago: item.tipoPago,
    }));

    // Si es REASIGNACIÓN (había vendedor anterior diferente)
    if (previousVendorId && previousVendorId !== vendorId && currentReservation.vendor) {
      logger.info(
        `Reasignación manual detectada: ${currentReservation.vendor.nombre} → ${newVendor.nombre} (Reserva ${reservationId})`
      );

      NotificationService.sendReassignmentNotification({
        reservationId,
        clienteNombre: currentReservation.nombreCompleto,
        clienteTelefono: currentReservation.telefono,
        clienteCurp: currentReservation.curp || undefined,
        itemsDetalle,
        direccion: currentReservation.direccion,
        fechaPreferida: currentReservation.fechaPreferida,
        horarioPreferido: currentReservation.horarioPreferido,
        latitude: currentReservation.latitude ? Number(currentReservation.latitude) : undefined,
        longitude: currentReservation.longitude ? Number(currentReservation.longitude) : undefined,
        previousVendor: {
          nombre: currentReservation.vendor.nombre,
          telefono: currentReservation.vendor.telefono || undefined,
        },
        newVendor: {
          nombre: newVendor.nombre,
          email: newVendor.email,
          telefono: newVendor.telefono || undefined,
        },
      }).catch((err) => {
        logger.error(`Error enviando notificaciones de reasignación manual para reserva ${reservationId}:`, err);
      });
    }
    // Si es PRIMERA asignación (no había vendedor)
    else if (!previousVendorId) {
      logger.info(`Primera asignación manual: ${newVendor.nombre} (Reserva ${reservationId})`);

      NotificationService.sendReservationNotification({
        reservationId,
        vendorEmail: newVendor.email,
        vendorNombre: newVendor.nombre,
        vendorTelefono: newVendor.telefono || undefined,
        clienteNombre: currentReservation.nombreCompleto,
        clienteTelefono: currentReservation.telefono,
        clienteCurp: currentReservation.curp || undefined,
        productoNombre: itemsDetalle.map((i) => i.nombre).join(', '),
        itemsDetalle,
        tipoPago: itemsDetalle.some((i) => i.tipoPago === 'CREDITO') ? 'CREDITO' : 'CONTADO',
        direccion: currentReservation.direccion,
        fechaPreferida: currentReservation.fechaPreferida,
        horarioPreferido: currentReservation.horarioPreferido,
        latitude: currentReservation.latitude ? Number(currentReservation.latitude) : undefined,
        longitude: currentReservation.longitude ? Number(currentReservation.longitude) : undefined,
      }).catch((err) => {
        logger.error(`Error enviando notificaciones de primera asignación manual para reserva ${reservationId}:`, err);
      });
    }
    // Si es el mismo vendedor, no hacer nada
    else {
      logger.info(`Asignación manual al mismo vendedor, sin notificaciones (Reserva ${reservationId})`);
    }
  }

  /**
   * Obtiene la estrategia de asignación activa, usando cache para optimizar.
   */
  private async getEstrategiaActiva(): Promise<EstrategiaAsignacion> {
    const now = Date.now();

    // Usar cache si está vigente
    if (this.estrategiaCache && now < this.cacheExpiry) {
      return this.estrategiaCache;
    }

    // Leer de DB
    const config = await prisma.configuracionAsignacion.findFirst({
      orderBy: { id: 'desc' },
    });

    const estrategia = config?.estrategia || 'ROUND_ROBIN';

    // Actualizar cache
    this.estrategiaCache = estrategia;
    this.cacheExpiry = now + this.CACHE_TTL;

    return estrategia;
  }

  /**
   * Invalida el cache de configuración.
   * Debe llamarse cuando se actualiza la configuración de asignación.
   */
  invalidateCache(): void {
    this.estrategiaCache = null;
    this.cacheExpiry = 0;
    logger.info('Cache de configuración de asignación invalidado');
  }

  /**
   * Notifica a todos los admins activos que hay una reserva pendiente de asignación manual.
   */
  private async notifyAdminsOfPendingAssignment(reservationId: string): Promise<void> {
    try {
      // Obtener datos completos de la reserva para armar la notificación
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!reservation) {
        logger.error(`No se encontró la reserva ${reservationId} para notificar asignación pendiente`);
        return;
      }

      // Preparar datos para notificación
      const itemsDetalle = reservation.items.map((item) => ({
        nombre: item.product.nombre,
        color: item.color,
        memoria: item.memoria,
        tipoPago: item.tipoPago,
      }));

      await NotificationService.sendPendingAssignmentNotification({
        reservationId: reservation.id,
        clienteNombre: reservation.nombreCompleto,
        clienteTelefono: reservation.telefono,
        clienteCurp: reservation.curp || undefined,
        itemsDetalle,
        direccion: reservation.direccion,
        fechaPreferida: reservation.fechaPreferida,
        horarioPreferido: reservation.horarioPreferido,
        latitude: reservation.latitude ? Number(reservation.latitude) : undefined,
        longitude: reservation.longitude ? Number(reservation.longitude) : undefined,
      });

      logger.info(`Notificaciones de asignación pendiente enviadas a admins para reserva ${reservationId}`);
    } catch (err) {
      // No lanzar error, solo loguear — las notificaciones no deben romper el flujo
      logger.error(`Error notificando admins de asignación pendiente para reserva ${reservationId}:`, err);
    }
  }
}

export const assignmentService = new AssignmentService();
