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

  /**
   * Buscar múltiples productos por IDs en una sola query (batch).
   * Evita el patrón N+1 donde se consulta uno por uno en un loop.
   */
  async findByIds(ids: string[]) {
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
    });
    return products.map(p => ({
      ...p,
      precio: Number(p.precio),
      precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : null,
    }));
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
    const result = await prisma.$queryRaw<{ color: string }[]>`
      SELECT DISTINCT UNNEST(colores) AS color
      FROM products
      WHERE "isActive" = true
      ORDER BY color
    `;
    return result.map((r) => r.color);
  }

  async getMemorias(): Promise<string[]> {
    const result = await prisma.$queryRaw<{ memoria: string }[]>`
      SELECT DISTINCT UNNEST(memorias) AS memoria
      FROM products
      WHERE "isActive" = true
      ORDER BY LENGTH(memoria), memoria
    `;
    return result.map((r) => r.memoria);
  }

  // Productos con más items vendidos, para la sección "Más populares"
  // Optimizado: usa JOIN + GROUP BY + LIMIT en la DB en lugar de cargar todo y ordenar en JS
  async findPopulares(limit = 6) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT
        p.id, p.sku, p.nombre, p.marca, p.descripcion,
        p.precio, p."precioAnterior", p.stock, p."stockMinimo",
        p.colores, p.memorias, p."pagosSemanales",
        p."disponibleCredito", p.badge, p.imagenes,
        p."isActive", p."createdAt",
        COUNT(ri.id)::int AS "salesCount"
      FROM products p
      LEFT JOIN reservation_items ri ON ri."productId" = p.id AND ri.estado = 'VENDIDO'
      WHERE p."isActive" = true
      GROUP BY p.id
      ORDER BY "salesCount" DESC, p.badge ASC NULLS LAST, p."createdAt" DESC
      LIMIT $1
    `, limit);

    return (result as any[]).map((product) => ({
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
