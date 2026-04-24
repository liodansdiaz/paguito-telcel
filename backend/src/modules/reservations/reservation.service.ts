import { reservationRepository, ReservationFilters, CreateReservationItemInput } from './reservation.repository';
import { customerRepository } from '../customers/customer.repository';
import { productRepository } from '../products/product.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import { assignmentService } from '../../shared/services/assignment.service';
import { ScheduleValidatorService } from '../../shared/services/schedule.validator';
import { NotificationService } from '../../shared/services/notification.service';
import { EstadoReserva, EstadoReservaItem, TipoPago } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

/**
 * DTO para crear un item de reserva
 */
export interface CreateReservationItemDTO {
  productId: string;
  color?: string;
  memoria?: string;
  tipoPago: TipoPago;
}

/**
 * DTO para crear una reserva completa (carrito multi-producto)
 */
export interface CreateReservationDTO {
  items: CreateReservationItemDTO[]; // Array de productos
  nombreCompleto: string;
  telefono: string;
  curp?: string; // Opcional: solo requerido si hay productos a crédito
  direccion: string;
  fechaPreferida: Date;
  horarioPreferido: string;
  latitude?: number | null;
  longitude?: number | null;
  notas?: string;
}

export class ReservationService {
  /**
   * Crear nueva reserva con carrito multi-producto
   * 
   * REGLAS DE NEGOCIO:
   * 1. Solo se permite 1 producto a crédito activo por cliente (CURP)
   * 2. Se permite múltiples productos de contado
   * 3. Si algún producto no tiene stock, se crea de todas formas y se notifica al admin
   * 4. Se asigna un solo vendedor para toda la reserva (Round Robin)
   */
  async createReservation(dto: CreateReservationDTO) {
    // Validación básica
    if (!dto.items || dto.items.length === 0) {
      throw new AppError('Debes agregar al menos un producto al carrito.', 400);
    }

    // 1. Validar horario de visita
    ScheduleValidatorService.validateOrThrow(dto.fechaPreferida, dto.horarioPreferido);

    // 2. Normalizar CURP si se proporciona (SIEMPRE a mayúsculas para evitar duplicados)
    const curpUpper = dto.curp ? dto.curp.toUpperCase().trim() : undefined;

    // 3. Contar productos a crédito en el carrito
    const productosCredito = dto.items.filter(item => item.tipoPago === 'CREDITO');

    // 4. VALIDACIÓN: CURP requerida solo si hay productos a crédito
    if (productosCredito.length > 0) {
      // Si hay productos a crédito, CURP es OBLIGATORIA
      if (!curpUpper || curpUpper.length === 0) {
        throw new AppError('La CURP es requerida cuando seleccionas productos a crédito.', 400);
      }

      // Validar que solo hay 1 producto a crédito en el carrito
      if (productosCredito.length > 1) {
        throw new AppError(
          'Solo puedes agregar un producto a crédito por reserva. Los demás deben ser de contado.',
          400
        );
      }

      // Verificar que no tiene otro crédito activo
      const existingCreditItem = await reservationRepository.findActiveCreditItemByCustomer(curpUpper);
      if (existingCreditItem) {
        throw new AppError(
          `Ya tienes un producto a crédito en proceso (${existingCreditItem.product.nombre}). Solo puedes tener un celular a crédito a la vez.`,
          409
        );
      }
    }

    // 5. Validar que todos los productos existen y están activos (batch query)
    const productIds = dto.items.map(item => item.productId);
    const productsFound = await productRepository.findByIds(productIds);
    const productsMap = new Map(productsFound.map(p => [p.id, p]));
    const productosAgotados: string[] = [];

    for (const item of dto.items) {
      const product = productsMap.get(item.productId);

      if (!product || !product.isActive) {
        throw new AppError(`El producto ${item.productId} no está disponible.`, 404);
      }

      // Detectar stock agotado (se permite de todas formas)
      if (product.stock <= 0) {
        productosAgotados.push(product.nombre);
      }
    }

    // 6. Upsert cliente
    const customer = await customerRepository.upsertByCurp({
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
      curp: curpUpper, // Puede ser undefined si es todo de contado
      direccion: dto.direccion,
    });

    // 7. Preparar items con precio capturado
    const itemsToCreate: CreateReservationItemInput[] = dto.items.map(item => {
      const product = productsMap.get(item.productId)!;
      return {
        productId: item.productId,
        color: item.color,
        memoria: item.memoria,
        tipoPago: item.tipoPago,
        precioCapturado: parseFloat(product.precio.toString()),
      };
    });

    // 8. Crear la reserva con todos sus items (sin vendedor asignado aún)
    const reservation = await reservationRepository.create({
      customerId: customer.id,
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
      curp: curpUpper,
      direccion: dto.direccion,
      latitude: dto.latitude ?? undefined,
      longitude: dto.longitude ?? undefined,
      fechaPreferida: dto.fechaPreferida,
      horarioPreferido: dto.horarioPreferido,
      notas: dto.notas,
      items: itemsToCreate,
    });

    logger.info(`Reserva creada: ${reservation.id} — Cliente: ${dto.nombreCompleto} — Items: ${dto.items.length}`);

    // 9. Asignar vendedor según estrategia configurada (Round Robin o Manual)
    const vendorId = await assignmentService.assignVendor(reservation.id);

    // Obtener datos actualizados de la reserva después de la asignación
    const reservationWithVendor = await reservationRepository.findById(reservation.id);

    // 10. Enviar notificaciones (no bloquea si falla)

    // 10a. Si hay productos sin stock, notificar a admins
    if (productosAgotados.length > 0) {
      NotificationService.sendStockAgotadoAlert({
        reservationId: reservation.id,
        productId: dto.items[0].productId, // Primer producto para referencia
        productoNombre: productosAgotados.join(', '),
        clienteNombre: dto.nombreCompleto,
        stockActual: 0,
      }).catch((err) => {
        logger.error(`Alerta de stock agotado falló para reserva ${reservation.id}:`, err);
      });
    }

    // 10b. Notificar al vendedor asignado (solo si hay vendedor asignado)
    // Si la estrategia es MANUAL, las notificaciones a admins ya se enviaron en assignmentService
    if (vendorId && reservationWithVendor?.vendor) {
      // Construir detalle de items para notificaciones
      const itemsDetalle = dto.items.map(item => ({
        nombre: productsMap.get(item.productId)?.nombre ?? 'Producto desconocido',
        color: item.color,
        memoria: item.memoria,
        tipoPago: item.tipoPago,
      }));

      NotificationService.sendReservationNotification({
        reservationId: reservation.id,
        vendorEmail: reservationWithVendor.vendor.email,
        vendorNombre: reservationWithVendor.vendor.nombre,
        vendorTelefono: reservationWithVendor.vendor.telefono ?? undefined,
        clienteNombre: dto.nombreCompleto,
        clienteTelefono: dto.telefono,
        clienteCurp: curpUpper,
        productoNombre: Array.from(productsMap.values()).map(p => p.nombre).join(', '),
        itemsDetalle,
        tipoPago: productosCredito.length > 0 ? 'CREDITO' : 'CONTADO',
        direccion: dto.direccion,
        fechaPreferida: dto.fechaPreferida,
        horarioPreferido: dto.horarioPreferido,
        latitude: dto.latitude ?? undefined,
        longitude: dto.longitude ?? undefined,
      }).catch((err) => {
        logger.error(`Notificación falló para reserva ${reservation.id}:`, err);
      });
    } else {
      logger.info(`Reserva ${reservation.id} creada sin vendedor asignado (modo Manual) — Notificaciones enviadas a admins`);
    }

    return reservationWithVendor!;
  }

  /**
   * Obtener todas las reservas con filtros
   */
  async getAll(filters: ReservationFilters) {
    return reservationRepository.findAll(filters);
  }

  /**
   * Obtener reserva por ID con todos sus items
   */
  async getById(id: string) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw new AppError('Reserva no encontrada.', 404);
    return reservation;
  }

  /**
   * Actualizar estado general de la reserva
   * NOTA: En el nuevo modelo, es mejor actualizar items individuales
   */
  async updateStatus(id: string, estado: EstadoReserva, notas?: string) {
    await this.getById(id);
    return reservationRepository.updateStatus(id, estado, notas);
  }

  /**
   * Actualizar estado de un item individual
   */
  async updateItemStatus(itemId: string, estado: EstadoReservaItem, notas?: string) {
    const item = await reservationRepository.findItemById(itemId);
    if (!item) throw new AppError('Item no encontrado.', 404);

    return reservationRepository.updateItemStatus(itemId, estado, notas);
  }

  /**
   * Marcar un item como VENDIDO y decrementar stock
   */
  async markItemAsSold(itemId: string, notas?: string) {
    const item = await reservationRepository.findItemById(itemId);
    if (!item) throw new AppError('Item no encontrado.', 404);

    if (item.estado !== 'PENDIENTE' && item.estado !== 'EN_PROCESO') {
      throw new AppError('El item no está en un estado que permita marcarlo como vendido.', 400);
    }

    return reservationRepository.markItemAsSold(itemId, notas);
  }

  /**
   * Cancelar un item individual
   * Solo se permite si está en estado PENDIENTE o EN_PROCESO
   */
  async cancelItem(itemId: string, notas?: string) {
    const item = await reservationRepository.findItemById(itemId);
    if (!item) throw new AppError('Item no encontrado.', 404);

    if (item.estado !== 'PENDIENTE' && item.estado !== 'EN_PROCESO') {
      throw new AppError('El item no puede cancelarse porque ya fue procesado.', 400);
    }

    return reservationRepository.cancelItem(itemId, notas);
  }

  /**
   * Cancelar toda la reserva (todos los items activos)
   */
  async cancelReservation(reservationId: string, notas?: string) {
    const reservation = await this.getById(reservationId);

    // Validar que la reserva esté en un estado cancelable
    if (!['NUEVA', 'ASIGNADA', 'EN_VISITA', 'PARCIAL'].includes(reservation.estado)) {
      throw new AppError('Esta reserva no puede cancelarse porque ya fue completada.', 400);
    }

    return reservationRepository.cancelReservation(reservationId, notas);
  }

  /**
   * Eliminar físicamente una reserva y todos sus datos relacionados
   * Si el cliente solo tiene esta reserva, también se elimina el cliente
   */
  async delete(id: string) {
    await this.getById(id);
    const resultado = await reservationRepository.delete(id);
    if (resultado.clienteEliminado) {
      logger.info(`Reserva eliminada: ${id} — Cliente "${resultado.clienteNombre}" también eliminado (sin más reservas)`);
    } else {
      logger.info(`Reserva eliminada: ${id} — Cliente "${resultado.clienteNombre}" conservado (tiene más reservas)`);
    }
  }

  /**
   * Asignar o reasignar vendedor a una reserva
   */
  async assignVendor(id: string, vendorId: string) {
    // Obtener reserva actual con todos los datos necesarios
    const currentReservation = await reservationRepository.findById(id);
    if (!currentReservation) throw new AppError('Reserva no encontrada.', 404);

    const previousVendorId = currentReservation.vendorId;

    // Validar nuevo vendedor
    const newVendor = await prisma.user.findUnique({
      where: { id: vendorId, isActive: true },
      select: { id: true, nombre: true, email: true, telefono: true },
    });
    if (!newVendor) throw new AppError('Vendedor no encontrado o inactivo.', 404);

    // Actualizar reserva
    const updated = await reservationRepository.assignVendor(id, vendorId);

    // Notificaciones según el tipo de asignación
    const itemsDetalle = currentReservation.items.map((item) => ({
      nombre: item.product?.nombre ?? 'Producto desconocido',
      color: item.color,
      memoria: item.memoria,
      tipoPago: item.tipoPago,
    }));

    // Si es REASIGNACIÓN (había vendedor anterior diferente)
    if (previousVendorId && previousVendorId !== vendorId && currentReservation.vendor) {
      logger.info(`Reasignación detectada: ${currentReservation.vendor.nombre} → ${newVendor.nombre} (Reserva ${id})`);

      NotificationService.sendReassignmentNotification({
        reservationId: id,
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
        logger.error(`Error enviando notificaciones de reasignación para reserva ${id}:`, err);
      });
    }
    // Si es PRIMERA asignación (no había vendedor)
    else if (!previousVendorId) {
      logger.info(`Primera asignación: ${newVendor.nombre} (Reserva ${id})`);

      NotificationService.sendReservationNotification({
        reservationId: id,
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
        logger.error(`Error enviando notificaciones de primera asignación para reserva ${id}:`, err);
      });
    }
    // Si es el mismo vendedor, no hacer nada (no tiene sentido notificar)
    else {
      logger.info(`Asignación al mismo vendedor, sin notificaciones (Reserva ${id})`);
    }

    return updated;
  }

  /**
   * Obtener reservas de un vendedor
   */
  async getVendorReservations(vendorId: string, filters: ReservationFilters) {
    return reservationRepository.findByVendor(vendorId, filters);
  }

  /**
   * Obtener datos de mapa para un vendedor
   */
  async getVendorMapData(vendorId: string) {
    return reservationRepository.findMapDataByVendor(vendorId);
  }

  /**
   * Consultar reserva activa por folio o CURP (consulta pública)
   */
  async consultarReserva(busqueda: string) {
    if (!busqueda || busqueda.trim().length < 8) {
      throw new AppError('Ingresa tu número de folio o CURP para buscar tu reserva.', 400);
    }
    const reservation = await reservationRepository.findActiveByCurpOrId(busqueda);
    if (!reservation) {
      throw new AppError('No encontramos ninguna reserva activa con ese dato. Verifica tu folio o CURP.', 404);
    }
    return reservation;
  }

  /**
   * Cancelar reserva desde la página pública "Mi Reserva"
   * El cliente puede cancelar:
   * - La reserva completa (si está en NUEVA o ASIGNADA)
   * - Items individuales (si están en PENDIENTE)
   */
  async cancelarPorCliente(busqueda: string, itemId?: string) {
    if (!busqueda || busqueda.trim().length < 8) {
      throw new AppError('Ingresa tu número de folio o CURP para cancelar.', 400);
    }

    const reservation = await reservationRepository.findActiveByCurpOrId(busqueda);
    if (!reservation) {
      throw new AppError('No encontramos ninguna reserva activa con ese dato.', 404);
    }

    const productoNombre = reservation.items.map(i => i.product.nombre).join(', ');
    const itemsDetalle = reservation.items.map(i => ({
      nombre: i.product.nombre,
      color: i.color,
      memoria: i.memoria,
      tipoPago: i.tipoPago,
    }));

    // Cancelar item individual
    if (itemId) {
      const item = reservation.items.find(i => i.id === itemId);
      if (!item) {
        throw new AppError('El producto no pertenece a esta reserva.', 404);
      }

      if (item.estado !== 'PENDIENTE') {
        throw new AppError('Este producto no puede cancelarse porque ya está en proceso.', 400);
      }

      await this.cancelItem(itemId, 'Cancelado por el cliente desde la web.');

      // Notificar cancelación de item
      NotificationService.sendCancellationNotification({
        reservationId: reservation.id,
        vendorNombre: reservation.vendor?.nombre ?? 'Sin asignar',
        vendorTelefono: reservation.vendor?.telefono ?? undefined,
        clienteNombre: reservation.nombreCompleto,
        clienteTelefono: reservation.telefono,
        itemsDetalle: [{
          nombre: item.product.nombre,
          color: item.color,
          memoria: item.memoria,
          tipoPago: item.tipoPago,
        }],
        motivo: 'Cancelación de producto individual por el cliente',
      }).catch((err) => {
        logger.error(`Notificación de cancelación de item falló para reserva ${reservation.id}:`, err);
      });

      return;
    }

    // Cancelar reserva completa
    if (!['NUEVA', 'ASIGNADA'].includes(reservation.estado)) {
      throw new AppError('Esta reserva no puede cancelarse porque ya está en proceso de visita.', 409);
    }

    await this.cancelReservation(reservation.id, 'Cancelada por el cliente desde la web.');

    // Notificar cancelación de reserva completa
    NotificationService.sendCancellationNotification({
      reservationId: reservation.id,
      vendorNombre: reservation.vendor?.nombre ?? 'Sin asignar',
      vendorTelefono: reservation.vendor?.telefono ?? undefined,
      clienteNombre: reservation.nombreCompleto,
      clienteTelefono: reservation.telefono,
      itemsDetalle,
      motivo: 'Cancelación total por el cliente',
    }).catch((err) => {
      logger.error(`Notificación de cancelación falló para reserva ${reservation.id}:`, err);
    });
  }

  /**
   * Modificar datos de una reserva desde la página pública.
   * Solo permite modificar: fecha, horario, dirección y coordenadas.
   * Solo si la reserva está en estado NUEVA o ASIGNADA.
   */
  async modifyReservation(busqueda: string, dto: {
    fechaPreferida?: Date;
    horarioPreferido?: string;
    direccion?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) {
    if (!busqueda || busqueda.trim().length < 8) {
      throw new AppError('Ingresa tu número de folio o CURP.', 400);
    }

    // Verificar que al menos un campo fue enviado
    if (!dto.fechaPreferida && !dto.horarioPreferido && !dto.direccion && dto.latitude === undefined && dto.longitude === undefined) {
      throw new AppError('Debes enviar al menos un campo para modificar.', 400);
    }

    const reservation = await reservationRepository.findActiveByCurpOrId(busqueda);
    if (!reservation) {
      throw new AppError('No encontramos ninguna reserva activa con ese dato.', 404);
    }

    if (!['NUEVA', 'ASIGNADA'].includes(reservation.estado)) {
      throw new AppError('Esta reserva no puede modificarse porque ya está en proceso de visita.', 409);
    }

    // Si se cambia la fecha u horario, validar horario de atención
    if (dto.fechaPreferida || dto.horarioPreferido) {
      const fecha = dto.fechaPreferida ?? reservation.fechaPreferida;
      const horario = dto.horarioPreferido ?? reservation.horarioPreferido;
      ScheduleValidatorService.validateOrThrow(fecha, horario);
    }

    // Guardar valores anteriores para la notificación
    const fechaAnterior = reservation.fechaPreferida;
    const horarioAnterior = reservation.horarioPreferido;
    const direccionAnterior = reservation.direccion;

    // Actualizar
    const updated = await reservationRepository.updateClientFields(reservation.id, dto);

    logger.info(`Reserva modificada: ${reservation.id} — Cliente: ${reservation.nombreCompleto}`);

    // Notificar cambios
    const itemsDetalle = reservation.items.map(i => ({
      nombre: i.product.nombre,
      color: i.color,
      memoria: i.memoria,
      tipoPago: i.tipoPago,
    }));

    NotificationService.sendModificationNotification({
      reservationId: reservation.id,
      vendorNombre: reservation.vendor?.nombre ?? 'Sin asignar',
      vendorTelefono: reservation.vendor?.telefono ?? undefined,
      clienteNombre: reservation.nombreCompleto,
      clienteTelefono: reservation.telefono,
      itemsDetalle,
      fechaAnterior,
      fechaNueva: dto.fechaPreferida ?? fechaAnterior,
      horarioAnterior,
      horarioNuevo: dto.horarioPreferido ?? horarioAnterior,
      direccionAnterior,
      direccionNueva: dto.direccion ?? direccionAnterior,
      latitude: dto.latitude !== undefined ? dto.latitude ?? undefined : reservation.latitude ? Number(reservation.latitude) : undefined,
      longitude: dto.longitude !== undefined ? dto.longitude ?? undefined : reservation.longitude ? Number(reservation.longitude) : undefined,
    }).catch((err) => {
      logger.error(`Notificación de modificación falló para reserva ${reservation.id}:`, err);
    });

    return updated;
  }

  /**
   * Obtener un item específico (para vendedor/admin)
   */
  async getItemById(itemId: string) {
    const item = await reservationRepository.findItemById(itemId);
    if (!item) throw new AppError('Item no encontrado.', 404);
    return item;
  }
}

export const reservationService = new ReservationService();
