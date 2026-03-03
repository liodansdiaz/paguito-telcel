import { reservationRepository, ReservationFilters } from './reservation.repository';
import { customerRepository } from '../customers/customer.repository';
import { productRepository } from '../products/product.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import { RoundRobinService } from '../../shared/services/roundrobin.service';
import { ScheduleValidatorService } from '../../shared/services/schedule.validator';
import { NotificationService } from '../../shared/services/notification.service';
import { EstadoReserva, TipoPago } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

export interface CreateReservationDTO {
  productId: string;
  nombreCompleto: string;
  telefono: string;
  curp: string;
  tipoPago: TipoPago;
  direccion: string;
  fechaPreferida: Date;
  horarioPreferido: string;
  latitude: number;
  longitude: number;
}

export class ReservationService {
  async createReservation(dto: CreateReservationDTO) {
    // 1. Validar producto existe y está activo
    const product = await productRepository.findById(dto.productId);
    if (!product || !product.isActive) {
      throw new AppError('El producto no está disponible.', 404);
    }

    if (product.stock <= 0) {
      throw new AppError('Lo sentimos, este modelo está sin stock actualmente.', 409);
    }

    // 2. Validar horario
    ScheduleValidatorService.validateOrThrow(dto.fechaPreferida, dto.horarioPreferido);

    // 3. Verificar que el cliente no tenga reserva activa (por CURP)
    const curpUpper = dto.curp.toUpperCase().trim();
    const existingReservation = await reservationRepository.findActiveByCustomer(curpUpper);
    if (existingReservation) {
      throw new AppError(
        `Ya tienes una reserva activa (#${existingReservation.id.slice(0, 8).toUpperCase()}). Espera a que sea completada o cancelada antes de hacer una nueva.`,
        409
      );
    }

    // 4. Upsert cliente
    const customer = await customerRepository.upsertByCurp({
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
      curp: curpUpper,
      direccion: dto.direccion,
    });

    // 5. Asignar vendedor Round Robin
    const vendorId = await RoundRobinService.getNextVendor();
    const vendor = await prisma.user.findUniqueOrThrow({
      where: { id: vendorId },
      select: { id: true, nombre: true, email: true },
    });

    // 6. Crear la reserva
    const reservation = await reservationRepository.create({
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
      curp: curpUpper,
      tipoPago: dto.tipoPago,
      direccion: dto.direccion,
      fechaPreferida: dto.fechaPreferida,
      horarioPreferido: dto.horarioPreferido,
      latitude: dto.latitude,
      longitude: dto.longitude,
      estado: 'ASIGNADA',
      customer: { connect: { id: customer.id } },
      product: { connect: { id: product.id } },
      vendor: { connect: { id: vendorId } },
    });

    logger.info(`Reserva creada: ${reservation.id} — Cliente: ${dto.nombreCompleto} — Producto: ${product.nombre} — Vendedor: ${vendor.nombre}`);

    // 7. Enviar notificaciones (no bloquea si falla)
    NotificationService.sendReservationNotification({
      reservationId: reservation.id,
      vendorEmail: vendor.email,
      vendorNombre: vendor.nombre,
      clienteNombre: dto.nombreCompleto,
      clienteTelefono: dto.telefono,
      clienteCurp: curpUpper,
      productoNombre: product.nombre,
      tipoPago: dto.tipoPago,
      direccion: dto.direccion,
      fechaPreferida: dto.fechaPreferida,
      horarioPreferido: dto.horarioPreferido,
      latitude: dto.latitude,
      longitude: dto.longitude,
    }).catch((err) => {
      logger.error(`Notificación falló para reserva ${reservation.id}:`, err);
    });

    return reservation;
  }

  async getAll(filters: ReservationFilters) {
    return reservationRepository.findAll(filters);
  }

  async getById(id: string) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw new AppError('Reserva no encontrada.', 404);
    return reservation;
  }

  async updateStatus(id: string, estado: EstadoReserva, notas?: string) {
    await this.getById(id);
    return reservationRepository.updateStatus(id, estado, notas);
  }

  async assignVendor(id: string, vendorId: string) {
    await this.getById(id);
    const vendor = await prisma.user.findUnique({
      where: { id: vendorId, isActive: true },
    });
    if (!vendor) throw new AppError('Vendedor no encontrado o inactivo.', 404);
    return reservationRepository.assignVendor(id, vendorId);
  }

  async getVendorReservations(vendorId: string, filters: ReservationFilters) {
    return reservationRepository.findByVendor(vendorId, filters);
  }

  async getVendorMapData(vendorId: string) {
    return reservationRepository.findMapDataByVendor(vendorId);
  }
}

export const reservationService = new ReservationService();
