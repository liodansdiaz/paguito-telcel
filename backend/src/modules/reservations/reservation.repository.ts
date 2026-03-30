import { prisma } from '../../config/database';
import { EstadoReserva, EstadoReservaItem, TipoPago, Prisma } from '@prisma/client';

export interface ReservationFilters {
  estado?: EstadoReserva;
  vendorId?: string;
  customerId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  search?: string;
  tipoPago?: TipoPago;
  producto?: string;
  page?: number;
  limit?: number;
}

export interface CreateReservationItemInput {
  productId: string;
  color?: string;
  memoria?: string;
  tipoPago: TipoPago;
  precioCapturado: number;
}

export interface CreateReservationInput {
  customerId: string;
  nombreCompleto: string;
  telefono: string;
  curp: string;
  direccion: string;
  latitude?: number;
  longitude?: number;
  fechaPreferida: Date;
  horarioPreferido: string;
  notas?: string;
  items: CreateReservationItemInput[];
}

const reservationInclude = {
  customer: { 
    select: { 
      id: true, 
      nombreCompleto: true, 
      telefono: true, 
      curp: true, 
      estado: true 
    } 
  },
  items: {
    include: {
      product: { 
        select: { 
          id: true, 
          nombre: true, 
          marca: true, 
          precio: true, 
          imagenes: true,
          stock: true,
        } 
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  vendor: { 
    select: { 
      id: true, 
      nombre: true, 
      email: true, 
      telefono: true, 
      zona: true 
    } 
  },
};

export class ReservationRepository {
  /**
   * Buscar todas las reservas con filtros
   */
  async findAll(filters: ReservationFilters = {}) {
    const { estado, vendorId, customerId, fechaDesde, fechaHasta, search, tipoPago, producto, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReservationWhereInput = {};
    
    if (estado) where.estado = estado;
    if (vendorId) where.vendorId = vendorId;
    if (customerId) where.customerId = customerId;
    
    // Filtro por tipo de pago: buscar en items
    if (tipoPago) {
      where.items = {
        some: { tipoPago }
      };
    }
    
    // Filtro por rango de fechas
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) (where.createdAt as any).gte = fechaDesde;
      if (fechaHasta) (where.createdAt as any).lte = fechaHasta;
    }
    
    // Búsqueda de texto en datos del cliente
    if (search) {
      where.OR = [
        { nombreCompleto: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
        { curp: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Filtro por producto: buscar en items
    if (producto) {
      where.items = {
        some: {
          product: {
            nombre: { contains: producto, mode: 'insensitive' }
          }
        }
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

  /**
   * Buscar reserva por ID con todos sus items
   */
  async findById(id: string) {
    return prisma.reservation.findUnique({
      where: { id },
      include: { 
        ...reservationInclude, 
        notifications: true 
      },
    });
  }

  /**
   * Buscar si el cliente tiene alguna reserva activa (no finalizada)
   * Estados activos: NUEVA, ASIGNADA, EN_VISITA, PARCIAL
   */
  async findActiveByCustomer(curp: string) {
    return prisma.reservation.findFirst({
      where: {
        curp,
        estado: { in: ['NUEVA', 'ASIGNADA', 'EN_VISITA', 'PARCIAL'] },
      },
      select: { 
        id: true, 
        estado: true, 
        createdAt: true,
        items: {
          select: {
            id: true,
            tipoPago: true,
            estado: true,
          }
        }
      },
    });
  }

  /**
   * Buscar si el cliente tiene algún PRODUCTO a crédito activo
   * REGLA DE NEGOCIO: Solo 1 producto a crédito activo por CURP
   * Estados activos del item: PENDIENTE, EN_PROCESO
   */
  async findActiveCreditItemByCustomer(curp: string) {
    return prisma.reservationItem.findFirst({
      where: {
        reservation: { curp },
        tipoPago: 'CREDITO',
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
      },
      select: { 
        id: true, 
        reservationId: true,
        estado: true, 
        tipoPago: true,
        product: {
          select: {
            nombre: true,
          }
        }
      },
    });
  }

  /**
   * Buscar reserva por CURP o ID (folio) para consulta pública
   * Solo devuelve reservas en estados consultables: NUEVA, ASIGNADA, EN_VISITA, PARCIAL
   */
  async findActiveByCurpOrId(busqueda: string) {
    const upper = busqueda.toUpperCase().trim();

    // Estados que el cliente puede consultar
    const estadosConsultables: EstadoReserva[] = ['NUEVA', 'ASIGNADA', 'EN_VISITA', 'PARCIAL'];

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
        direccion: true,
        latitude: true,
        longitude: true,
        fechaPreferida: true,
        horarioPreferido: true,
        estado: true,
        estadoDetalle: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            tipoPago: true,
            estado: true,
            precioCapturado: true,
            color: true,
            memoria: true,
            product: { 
              select: { 
                id: true, 
                nombre: true, 
                marca: true, 
                imagenes: true 
              } 
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        vendor: { select: { nombre: true, telefono: true } },
      },
    });
  }

  /**
   * Crear nueva reserva con múltiples items
   */
  async create(input: CreateReservationInput) {
    // Calcular estadoDetalle inicial
    const estadoDetalle = {
      total: input.items.length,
      pendientes: input.items.length,
      enProceso: 0,
      vendidos: 0,
      noConcretados: 0,
      cancelados: 0,
      sinStock: 0,
    };

    return prisma.reservation.create({
      data: {
        customerId: input.customerId,
        nombreCompleto: input.nombreCompleto,
        telefono: input.telefono,
        curp: input.curp,
        direccion: input.direccion,
        latitude: input.latitude,
        longitude: input.longitude,
        fechaPreferida: input.fechaPreferida,
        horarioPreferido: input.horarioPreferido,
        notas: input.notas,
        estado: 'NUEVA',
        estadoDetalle,
        items: {
          create: input.items.map(item => ({
            productId: item.productId,
            color: item.color,
            memoria: item.memoria,
            tipoPago: item.tipoPago,
            precioCapturado: item.precioCapturado,
            estado: 'PENDIENTE',
          })),
        },
      },
      include: reservationInclude,
    });
  }

  /**
   * Actualizar estado general de la reserva
   */
  async updateStatus(id: string, estado: EstadoReserva, notas?: string) {
    return prisma.reservation.update({
      where: { id },
      data: { 
        estado, 
        ...(notas !== undefined && { notas }) 
      },
      include: reservationInclude,
    });
  }

  /**
   * Actualizar estado de un item individual
   * También actualiza el estadoDetalle de la reserva y su estado general si corresponde
   */
  async updateItemStatus(itemId: string, estado: EstadoReservaItem, notas?: string) {
    // Obtener el item con su reserva
    const item = await prisma.reservationItem.findUniqueOrThrow({
      where: { id: itemId },
      include: {
        reservation: {
          include: {
            items: true,
          }
        }
      }
    });

    // Actualizar el item
    const updatedItem = await prisma.reservationItem.update({
      where: { id: itemId },
      data: { 
        estado,
        ...(notas !== undefined && { notas }) 
      },
      include: {
        product: true,
      }
    });

    // Recalcular estadoDetalle usando items ya cargados (sin query extra)
    // Actualizar el estado del item en el array local
    const siblingItems = item.reservation.items.map(i =>
      i.id === itemId ? { ...i, estado } : i
    );

    const estadoDetalle = {
      total: siblingItems.length,
      pendientes: siblingItems.filter(i => i.estado === 'PENDIENTE').length,
      enProceso: siblingItems.filter(i => i.estado === 'EN_PROCESO').length,
      vendidos: siblingItems.filter(i => i.estado === 'VENDIDO').length,
      noConcretados: siblingItems.filter(i => i.estado === 'NO_CONCRETADO').length,
      cancelados: siblingItems.filter(i => i.estado === 'CANCELADO').length,
      sinStock: siblingItems.filter(i => i.estado === 'SIN_STOCK').length,
    };

    // Determinar nuevo estado de la reserva
    let nuevoEstadoReserva: EstadoReserva = item.reservation.estado;

    if (estadoDetalle.cancelados === estadoDetalle.total) {
      // Todos cancelados
      nuevoEstadoReserva = 'CANCELADA';
    } else if (estadoDetalle.sinStock === estadoDetalle.total) {
      // Todos sin stock
      nuevoEstadoReserva = 'SIN_STOCK';
    } else if (estadoDetalle.vendidos + estadoDetalle.noConcretados === estadoDetalle.total) {
      // Todos finalizados (vendidos o no concretados)
      nuevoEstadoReserva = 'COMPLETADA';
    } else if (estadoDetalle.vendidos > 0 || estadoDetalle.noConcretados > 0 || estadoDetalle.cancelados > 0 || estadoDetalle.sinStock > 0) {
      // Algunos finalizados, otros no
      nuevoEstadoReserva = 'PARCIAL';
    }

    // Actualizar reserva
    await prisma.reservation.update({
      where: { id: item.reservationId },
      data: {
        estadoDetalle,
        estado: nuevoEstadoReserva,
      },
    });

    return updatedItem;
  }

  /**
   * Marcar un item como VENDIDO y decrementar el stock del producto
   * Se ejecuta en transacción atómica
   */
  async markItemAsSold(itemId: string, notas?: string) {
    return prisma.$transaction(async (tx) => {
      // Obtener el item con su producto
      const item = await tx.reservationItem.findUniqueOrThrow({
        where: { id: itemId },
        include: { product: true },
      });

      // Decrementar stock del producto
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: 1 } },
      });

      // Actualizar estado del item a VENDIDO
      return this.updateItemStatus(itemId, 'VENDIDO', notas);
    });
  }

  /**
   * Cancelar un item individual
   */
  async cancelItem(itemId: string, notas?: string) {
    return this.updateItemStatus(itemId, 'CANCELADO', notas);
  }

  /**
   * Cancelar todos los items de una reserva (cancelación completa)
   */
  async cancelReservation(reservationId: string, notas?: string) {
    return prisma.$transaction(async (tx) => {
      // Cancelar todos los items
      await tx.reservationItem.updateMany({
        where: { 
          reservationId,
          estado: { in: ['PENDIENTE', 'EN_PROCESO'] } // Solo cancelar items activos
        },
        data: { estado: 'CANCELADO' },
      });

      // Actualizar reserva
      const reservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { 
          estado: 'CANCELADA',
          ...(notas !== undefined && { notas })
        },
        include: reservationInclude,
      });

      // Recalcular estadoDetalle
      const allItems = await tx.reservationItem.findMany({
        where: { reservationId },
        select: { estado: true },
      });

      const estadoDetalle = {
        total: allItems.length,
        pendientes: allItems.filter(i => i.estado === 'PENDIENTE').length,
        enProceso: allItems.filter(i => i.estado === 'EN_PROCESO').length,
        vendidos: allItems.filter(i => i.estado === 'VENDIDO').length,
        noConcretados: allItems.filter(i => i.estado === 'NO_CONCRETADO').length,
        cancelados: allItems.filter(i => i.estado === 'CANCELADO').length,
        sinStock: allItems.filter(i => i.estado === 'SIN_STOCK').length,
      };

      await tx.reservation.update({
        where: { id: reservationId },
        data: { estadoDetalle },
      });

      return reservation;
    });
  }

  /**
   * Asignar vendedor a una reserva
   * Cambia el estado a ASIGNADA
   */
  async assignVendor(id: string, vendorId: string) {
    return prisma.reservation.update({
      where: { id },
      data: { 
        vendorId, 
        estado: 'ASIGNADA' 
      },
      include: reservationInclude,
    });
  }

  /**
   * Actualizar campos que el cliente puede modificar (fecha, horario, dirección, coords)
   */
  async updateClientFields(id: string, data: {
    fechaPreferida?: Date;
    horarioPreferido?: string;
    direccion?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) {
    return prisma.reservation.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: reservationInclude,
    });
  }

  /**
   * Buscar reservas de un vendedor
   */
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

  /**
   * Obtener datos de mapa para vendedor
   * Solo reservas con coordenadas GPS
   */
  async findMapDataByVendor(vendorId: string) {
    return prisma.reservation.findMany({
      where: {
        vendorId,
        estado: { in: ['ASIGNADA', 'EN_VISITA', 'NUEVA', 'PARCIAL'] },
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        nombreCompleto: true,
        fechaPreferida: true,
        horarioPreferido: true,
        estado: true,
        estadoDetalle: true,
        latitude: true,
        longitude: true,
        direccion: true,
        items: {
          select: {
            estado: true,
            product: { 
              select: { nombre: true } 
            },
          },
        },
      },
    });
  }

  /**
   * Eliminar físicamente una reserva y todos sus items
   * Si el cliente solo tiene esta reserva, también se elimina el cliente
   * Se ejecuta en transacción atómica
   */
  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      // Obtener la reserva para saber el customerId
      const reservation = await tx.reservation.findUniqueOrThrow({
        where: { id },
        select: { customerId: true, customer: { select: { nombreCompleto: true } } },
      });

      // Eliminar notificaciones relacionadas
      await tx.notification.deleteMany({ where: { reservationId: id } });
      // Eliminar items de la reserva
      await tx.reservationItem.deleteMany({ where: { reservationId: id } });
      // Eliminar la reserva
      await tx.reservation.delete({ where: { id } });

      // Verificar si el cliente tiene más reservas
      const remainingReservations = await tx.reservation.count({
        where: { customerId: reservation.customerId },
      });

      // Si no tiene más reservas, eliminar el cliente
      if (remainingReservations === 0) {
        await tx.customer.delete({ where: { id: reservation.customerId } });
        return { clienteEliminado: true, clienteNombre: reservation.customer.nombreCompleto };
      }

      return { clienteEliminado: false, clienteNombre: reservation.customer.nombreCompleto };
    });
  }

  /**
   * Obtener un item específico por ID
   */
  async findItemById(itemId: string) {
    return prisma.reservationItem.findUnique({
      where: { id: itemId },
      include: {
        product: true,
        reservation: {
          include: {
            customer: true,
            vendor: true,
          }
        }
      }
    });
  }
}

export const reservationRepository = new ReservationRepository();
