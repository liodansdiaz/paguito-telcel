import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export type ProductSort = 'reciente' | 'precio_asc' | 'precio_desc' | 'nombre_asc';

export interface ProductFilters {
  marca?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: ProductSort;
}

export class ProductRepository {
  async findAll(filters: ProductFilters = {}) {
    const { marca, isActive, search, page = 1, limit = 20, sort = 'reciente' } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (marca) where.marca = { equals: marca, mode: 'insensitive' };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'precio_asc'  ? { precio: 'asc' }    :
      sort === 'precio_desc' ? { precio: 'desc' }   :
      sort === 'nombre_asc'  ? { nombre: 'asc' }    :
      { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  }

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  }

  async toggleActive(id: string) {
    const product = await prisma.product.findUniqueOrThrow({ where: { id } });
    return prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });
  }

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }

  async getMarcas(): Promise<string[]> {
    const result = await prisma.product.findMany({
      where: { isActive: true },
      select: { marca: true },
      distinct: ['marca'],
      orderBy: { marca: 'asc' },
    });
    return result.map((r) => r.marca);
  }

  // Productos con más reservas completadas (VENDIDA), para la sección "Más populares"
  async findPopulares(limit = 6) {
    const result = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { reservations: { where: { estado: 'VENDIDA' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ordenar por ventas completadas desc; si empatan, priorizar los con badge
    return result
      .sort((a, b) => {
        const diff = b._count.reservations - a._count.reservations;
        if (diff !== 0) return diff;
        return a.badge ? -1 : 1;
      })
      .slice(0, limit);
  }

  // Productos en oferta (tienen precioAnterior definido)
  async findEnOferta(limit = 6) {
    return prisma.product.findMany({
      where: { isActive: true, precioAnterior: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const productRepository = new ProductRepository();
