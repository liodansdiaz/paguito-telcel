import { prisma } from '../../config/database';
import { EstadoCliente, Prisma } from '@prisma/client';

export interface CustomerFilters {
  search?: string;
  estado?: EstadoCliente;
  page?: number;
  limit?: number;
}

export class CustomerRepository {
  async findAll(filters: CustomerFilters = {}) {
    const { search, estado, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};
    if (estado) where.estado = estado;
    if (search) {
      where.OR = [
        { nombreCompleto: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
        { curp: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { reservations: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        reservations: {
          include: { product: true, vendor: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByCurp(curp: string) {
    return prisma.customer.findUnique({ where: { curp } });
  }

  async upsertByCurp(data: Prisma.CustomerCreateInput) {
    return prisma.customer.upsert({
      where: { curp: data.curp },
      create: data,
      update: {
        nombreCompleto: data.nombreCompleto,
        telefono: data.telefono,
        direccion: data.direccion,
      },
    });
  }

  async updateStatus(id: string, estado: EstadoCliente) {
    return prisma.customer.update({ where: { id }, data: { estado } });
  }
}

export const customerRepository = new CustomerRepository();
