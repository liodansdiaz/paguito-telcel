import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';

export class AdminNotificationsController {
  /**
   * Lista notificaciones con filtros
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { fecha, canal, status, busqueda, page = 1, limit = 50 } = z.object({
        fecha: z.string().optional(),        // '2026-04-02'
        canal: z.enum(['EMAIL', 'WHATSAPP', 'INTERNAL']).optional(),
        status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
        busqueda: z.string().optional(),
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(50),
      }).parse(req.query);

      // Construir filtros
      const where: any = {};

      if (fecha) {
        const startDate = new Date(fecha);
        const endDate = new Date(fecha);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt = { gte: startDate, lt: endDate };
      }

      if (canal) {
        where.canal = canal;
      }

      if (status) {
        where.status = status;
      }

      if (busqueda) {
        where.OR = [
          { mensaje: { contains: busqueda, mode: 'insensitive' } },
          { destinatario: { contains: busqueda, mode: 'insensitive' } },
          { destinatarioNombre: { contains: busqueda, mode: 'insensitive' } },
          { asunto: { contains: busqueda, mode: 'insensitive' } },
          { error: { contains: busqueda, mode: 'insensitive' } },
          { reservation: { nombreCompleto: { contains: busqueda, mode: 'insensitive' } } },
          { reservation: { id: { contains: busqueda, mode: 'insensitive' } } },
        ];
      }

      // Consultar con paginación
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            reservation: {
              select: {
                id: true,
                nombreCompleto: true,
                telefono: true,
                estado: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        notifications,
        total,
        page,
        totalPages,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Estadísticas de notificaciones
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        total,
        sent,
        failed,
        pending,
        sentToday,
        failedToday,
        emailCount,
        whatsappCount,
      ] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { status: 'SENT' } }),
        prisma.notification.count({ where: { status: 'FAILED' } }),
        prisma.notification.count({ where: { status: 'PENDING' } }),
        prisma.notification.count({ where: { status: 'SENT', createdAt: { gte: today } } }),
        prisma.notification.count({ where: { status: 'FAILED', createdAt: { gte: today } } }),
        prisma.notification.count({ where: { canal: 'EMAIL' } }),
        prisma.notification.count({ where: { canal: 'WHATSAPP' } }),
      ]);

      res.json({
        total,
        sent,
        failed,
        pending,
        sentToday,
        failedToday,
        emailCount,
        whatsappCount,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Detalle de una notificación
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = z.object({
        id: z.string().uuid(),
      }).parse(req.params);

      const notification = await prisma.notification.findUnique({
        where: { id },
        include: {
          reservation: {
            select: {
              id: true,
              nombreCompleto: true,
              telefono: true,
              curp: true,
              estado: true,
              createdAt: true,
            },
          },
        },
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notificación no encontrada' });
      }

      res.json(notification);
    } catch (err) {
      next(err);
    }
  }
}

export const adminNotificationsController = new AdminNotificationsController();
