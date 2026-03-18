import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export type ProductSort = 'reciente' | 'precio_asc' | 'precio_desc' | 'nombre_asc';

export interface ProductFilters {
  marca?: string | string[];
  isActive?: boolean;
  search?: string;
  color?: string;
  memoria?: string;
  precioMin?: number;
  precioMax?: number;
  page?: number;
  limit?: number;
  sort?: ProductSort;
}

export class ProductRepository {
  async findAll(filters: ProductFilters = {}) {
    const {
      marca, isActive, search, color, memoria,
      precioMin, precioMax,
      page = 1, limit = 20, sort = 'reciente'
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    const andConditions: Prisma.ProductWhereInput[] = [];

    // Condición de marca — se combina con AND
    if (marca) {
      const marcas = Array.isArray(marca) ? marca.filter(Boolean) : [marca];
      if (marcas.length === 1) {
        andConditions.push({ marca: { equals: marcas[0], mode: 'insensitive' } });
      } else if (marcas.length > 1) {
        andConditions.push({
          OR: marcas.map((m) => ({ marca: { equals: m, mode: 'insensitive' as const } })),
        });
      }
    }

    // Condición de búsqueda — también se combina con AND
    if (search) {
      andConditions.push({
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { marca: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Asignar condiciones AND si existen
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (isActive !== undefined) where.isActive = isActive;
    if (color) where.colores = { has: color };
    if (memoria) where.memorias = { has: memoria };
    if (precioMin !== undefined || precioMax !== undefined) {
      where.precio = {};
      if (precioMin !== undefined) (where.precio as Prisma.DecimalFilter).gte = precioMin;
      if (precioMax !== undefined) (where.precio as Prisma.DecimalFilter).lte = precioMax;
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

    // Convertir Decimal a number para serialización JSON
    const serializedData = data.map(product => ({
      ...product,
      precio: Number(product.precio),
      precioAnterior: product.precioAnterior ? Number(product.precioAnterior) : null,
    }));

    return { data: serializedData, total };
  }

  async findById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return null;
    
    // Convertir Decimal a number para serialización JSON
    return {
      ...product,
      precio: Number(product.precio),
      precioAnterior: product.precioAnterior ? Number(product.precioAnterior) : null,
    };
  }

  async create(data: Prisma.ProductCreateInput) {
    const product = await prisma.product.create({ data });
    return {
      ...product,
      precio: Number(product.precio),
      precioAnterior: product.precioAnterior ? Number(product.precioAnterior) : null,
    };
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    const product = await prisma.product.update({ where: { id }, data });
    return {
      ...product,
      precio: Number(product.precio),
      precioAnterior: product.precioAnterior ? Number(product.precioAnterior) : null,
    };
  }

  async toggleActive(id: string) {
    const product = await prisma.product.findUniqueOrThrow({ where: { id } });
    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });
    return {
      ...updated,
      precio: Number(updated.precio),
      precioAnterior: updated.precioAnterior ? Number(updated.precioAnterior) : null,
    };
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

  async getColores(): Promise<string[]> {
    const result = await prisma.product.findMany({
      where: { isActive: true },
      select: { colores: true },
    });
    const all = result.flatMap((r) => r.colores);
    return [...new Set(all)].sort();
  }

  async getMemorias(): Promise<string[]> {
    const result = await prisma.product.findMany({
      where: { isActive: true },
      select: { memorias: true },
    });
    const all = result.flatMap((r) => r.memorias);
    const unique = [...new Set(all)];
    // Ordenar: primero por valor numérico, luego alfabético
    return unique.sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA !== numB ? numA - numB : a.localeCompare(b);
    });
  }

  // Productos con más items vendidos, para la sección "Más populares"
  async findPopulares(limit = 6) {
    const result = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { reservationItems: { where: { estado: 'VENDIDO' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ordenar por ventas completadas desc; si empatan, priorizar los con badge
    const sorted = result
      .sort((a, b) => {
        const diff = b._count.reservationItems - a._count.reservationItems;
        if (diff !== 0) return diff;
        return a.badge ? -1 : 1;
      })
      .slice(0, limit);

    // Convertir Decimal a number para serialización JSON
    return sorted.map(product => ({
      ...product,
      precio: Number(product.precio),
      precioAnterior: product.precioAnterior ? Number(product.precioAnterior) : null,
    }));
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
