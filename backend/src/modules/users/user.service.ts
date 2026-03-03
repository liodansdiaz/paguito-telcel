import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import { Rol } from '@prisma/client';

export interface CreateUserDTO {
  nombre: string;
  email: string;
  password: string;
  rol?: Rol;
  zona?: string;
  telefono?: string;
}

export class UserService {
  async getAll(filters: { search?: string; isActive?: boolean; rol?: Rol } = {}) {
    const { search, isActive, rol } = filters;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (rol) where.rol = rol;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { zona: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true, nombre: true, email: true, rol: true, isActive: true,
        zona: true, telefono: true, lastAssignedAt: true, createdAt: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, nombre: true, email: true, rol: true, isActive: true,
        zona: true, telefono: true, lastAssignedAt: true, createdAt: true,
        reservations: {
          select: { id: true, estado: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!user) throw new AppError('Vendedor no encontrado.', 404);
    return user;
  }

  async create(dto: CreateUserDTO) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new AppError('Ya existe un usuario con ese email.', 409);

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    return prisma.user.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        password: hashedPassword,
        rol: dto.rol || 'VENDEDOR',
        zona: dto.zona,
        telefono: dto.telefono,
      },
      select: {
        id: true, nombre: true, email: true, rol: true,
        isActive: true, zona: true, telefono: true, createdAt: true,
      },
    });
  }

  async update(id: string, data: Partial<{
    nombre: string; zona: string; telefono: string; password: string; rol: Rol;
  }>) {
    await this.getById(id);
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }
    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, nombre: true, email: true, rol: true,
        isActive: true, zona: true, telefono: true, updatedAt: true,
      },
    });
  }

  async toggleActive(id: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, nombre: true, isActive: true },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    return prisma.user.delete({ where: { id } });
  }
}

export const userService = new UserService();
