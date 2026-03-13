import { prisma } from '../../config/database';
import { EstadoReserva, Prisma } from '@prisma/client';

export interface ReservationFilters {
  estado?: EstadoReserva;
  vendorId?: string;
  customerId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  search?: string;
  tipoPago?: 'CONTADO' | 'CREDITO';
  producto?: string;
  page?: number;
  limit?: number;
}

const reservationInclude = {
  customer: { select: { id: true, nombreCompleto: true, telefono: true, curp: true, estado: true } },
  product: { select: { id: true, nombre: true, marca: true, precio: true, imagenes: true } },
  vendor: { select: { id: true, nombre: true, email: true, telefono: true, zona: true } },
};

export class ReservationRepository {
  async findAll(filters: ReservationFilters = {}) {
    const { estado, vendorId, customerId, fechaDesde, fechaHasta, search, tipoPago, producto, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReservationWhereInput = {};
    if (estado) where.estado = estado;
    if (vendorId) where.vendorId = vendorId;
    if (customerId) where.customerId = customerId;
    if (tipoPago) where.tipoPago = tipoPago;
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
    if (producto) {
      where.product = {
        nombre: { contains: producto, mode: 'insensitive' }
      };
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

  async findActiveCreditByCustomer(curp: string) {
    return prisma.reservation.findFirst({
      where: {
        curp,
        tipoPago: 'CREDITO',
        estado: { in: ['NUEVA', 'ASIGNADA', 'EN_VISITA'] },
      },
      select: { id: true, estado: true, tipoPago: true },
    });
  }

  async findActiveByCurpOrId(busqueda: string) {
    const upper = busqueda.toUpperCase().trim();

    // Estados que el cliente puede consultar: NUEVA, ASIGNADA, EN_VISITA
    const estadosConsultables: EstadoReserva[] = ['NUEVA', 'ASIGNADA', 'EN_VISITA'];

    // Determinar modo de búsqueda por longitud/formato
    let where: Prisma.ReservationWhereInput;

    if (upper.length === 18) {
      // CURP exacto
      where = { curp: upper, estado: { in: estadosConsultables } };
    } else if (upper.length === 36) {
      // UUID completo
      where = { id: upper, estado: { in: estadosConsultables } };
    } else {
      // Folio corto (primeros 8 chars del UUID)
      where = {
        id: { startsWith: upper.toLowerCase() },
        estado: { in: estadosConsultables },
      };
    }

    return prisma.reservation.findFirst({
      where,
      select: {
        id: true,
        nombreCompleto: true,
        telefono: true,
        tipoPago: true,
        direccion: true,
        fechaPreferida: true,
        horarioPreferido: true,
        estado: true,
        createdAt: true,
        product: { select: { id: true, nombre: true, marca: true, imagenes: true } },
        vendor: { select: { nombre: true } },
      },
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

  /**
   * Actualiza el estado de una reserva a VENDIDA y decrementa el stock del producto
   * en una transacción atómica. Si el stock ya está en 0 quedará en negativo,
   * lo que sirve como señal visual de deuda de inventario para el admin.
   */
  async updateStatusVendida(id: string, productId: string, notas?: string) {
    const [reservation] = await prisma.$transaction([
      prisma.reservation.update({
        where: { id },
        data: { estado: 'VENDIDA', ...(notas !== undefined && { notas }) },
        include: reservationInclude,
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } },
      }),
    ]);

    return reservation;
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
