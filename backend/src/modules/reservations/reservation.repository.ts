import { prisma } from '../../config/database';
import { EstadoReserva, Prisma } from '@prisma/client';

export interface ReservationFilters {
  estado?: EstadoReserva;
  vendorId?: string;
  customerId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

const reservationInclude = {
  customer: { select: { id: true, nombreCompleto: true, telefono: true, curp: true, estado: true } },
  product: { select: { id: true, nombre: true, marca: true, precio: true, imagenUrl: true } },
  vendor: { select: { id: true, nombre: true, email: true, telefono: true, zona: true } },
};

export class ReservationRepository {
  async findAll(filters: ReservationFilters = {}) {
    const { estado, vendorId, customerId, fechaDesde, fechaHasta, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReservationWhereInput = {};
    if (estado) where.estado = estado;
    if (vendorId) where.vendorId = vendorId;
    if (customerId) where.customerId = customerId;
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) (where.createdAt as any).gte = fechaDesde;
      if (fechaHasta) (where.createdAt as any).lte = fechaHasta;
    }
    if (search) {
      where.OR = [
        { nombreCompleto: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
        { curp: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: reservationInclude,
      }),
      prisma.reservation.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.reservation.findUnique({
      where: { id },
      include: { ...reservationInclude, notifications: true },
    });
  }

  async findActiveByCustomer(curp: string) {
    return prisma.reservation.findFirst({
      where: {
        curp,
        estado: { in: ['NUEVA', 'ASIGNADA', 'EN_VISITA'] },
      },
      select: { id: true, estado: true, createdAt: true },
    });
  }

  async create(data: Prisma.ReservationCreateInput) {
    return prisma.reservation.create({
      data,
      include: reservationInclude,
    });
  }

  async updateStatus(id: string, estado: EstadoReserva, notas?: string) {
    return prisma.reservation.update({
      where: { id },
      data: { estado, ...(notas !== undefined && { notas }) },
      include: reservationInclude,
    });
  }

  async assignVendor(id: string, vendorId: string) {
    return prisma.reservation.update({
      where: { id },
      data: { vendorId, estado: 'ASIGNADA' },
      include: reservationInclude,
    });
  }

  async findByVendor(vendorId: string, filters: ReservationFilters = {}) {
    const { estado, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReservationWhereInput = { vendorId };
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaPreferida: 'asc' },
        include: reservationInclude,
      }),
      prisma.reservation.count({ where }),
    ]);

    return { data, total };
  }

  async findMapDataByVendor(vendorId: string) {
    return prisma.reservation.findMany({
      where: {
        vendorId,
        estado: { in: ['ASIGNADA', 'EN_VISITA', 'NUEVA'] },
        latitude: { not: undefined },
        longitude: { not: undefined },
      },
      select: {
        id: true,
        nombreCompleto: true,
        fechaPreferida: true,
        horarioPreferido: true,
        estado: true,
        latitude: true,
        longitude: true,
        direccion: true,
        product: { select: { nombre: true } },
      },
    });
  }
}

export const reservationRepository = new ReservationRepository();
