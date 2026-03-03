import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export interface ProductFilters {
  marca?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class ProductRepository {
  async findAll(filters: ProductFilters = {}) {
    const { marca, isActive, search, page = 1, limit = 20 } = filters;
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

    const [data, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
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

  async getMarcas(): Promise<string[]> {
    const result = await prisma.product.findMany({
      where: { isActive: true },
      select: { marca: true },
      distinct: ['marca'],
      orderBy: { marca: 'asc' },
    });
    return result.map((r) => r.marca);
  }
}

export const productRepository = new ProductRepository();
