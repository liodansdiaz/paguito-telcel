import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reservationService } from './reservation.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.helper';
import { EstadoReserva } from '@prisma/client';

const createReservationSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  nombreCompleto: z.string().min(3, 'Nombre completo requerido'),
  telefono: z.string().min(10, 'Teléfono inválido').max(15),
  curp: z.string().length(18, 'CURP debe tener 18 caracteres'),
  tipoPago: z.enum(['CONTADO', 'CREDITO']),
  direccion: z.string().min(10, 'Dirección completa requerida'),
  fechaPreferida: z.string().transform((val) => new Date(val)),
  horarioPreferido: z.string().regex(/^\d{1,2}:\d{2}$/, 'Formato de horario inválido (HH:MM)'),
  latitude: z.number().min(-90).max(90, 'Latitud inválida'),
  longitude: z.number().min(-180).max(180, 'Longitud inválida'),
});

const updateStatusSchema = z.object({
  estado: z.nativeEnum(EstadoReserva),
  notas: z.string().optional(),
});

export class ReservationController {
  // Crear reserva — ruta pública
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createReservationSchema.parse(req.body);
      const reservation = await reservationService.createReservation(dto);
      sendSuccess(res, reservation, 'Reserva creada exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  // Admin: listado
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, vendorId, search, fechaDesde, fechaHasta, page, limit } = req.query;
      const result = await reservationService.getAll({
        estado: estado as EstadoReserva,
        vendorId: vendorId as string,
        search: search as string,
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      sendPaginated(res, result.data, result.total, parseInt((page as string) || '1'), parseInt((limit as string) || '20'));
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await reservationService.getById(req.params['id'] as string);
      sendSuccess(res, reservation);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, notas } = updateStatusSchema.parse(req.body);
      const reservation = await reservationService.updateStatus(req.params['id'] as string, estado, notas);
      sendSuccess(res, reservation, 'Estado actualizado');
    } catch (err) {
      next(err);
    }
  }

  async assignVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = z.object({ vendorId: z.string().uuid() }).parse(req.body);
      const reservation = await reservationService.assignVendor(req.params['id'] as string, vendorId);
      sendSuccess(res, reservation, 'Vendedor asignado');
    } catch (err) {
      next(err);
    }
  }

  // Vendedor: sus reservas
  async getMyReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, page, limit } = req.query;
      const result = await reservationService.getVendorReservations(req.user!.userId, {
        estado: estado as EstadoReserva,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      sendPaginated(res, result.data, result.total, parseInt((page as string) || '1'), parseInt((limit as string) || '20'));
    } catch (err) {
      next(err);
    }
  }

  // Vendedor: datos del mapa
  async getMyMapData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reservationService.getVendorMapData(req.user!.userId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  // Público: consultar reserva por folio o CURP
  async consulta(req: Request, res: Response, next: NextFunction) {
    try {
      const { busqueda } = z.object({ busqueda: z.string().min(8) }).parse(req.body);
      const reservation = await reservationService.consultarReserva(busqueda);
      sendSuccess(res, reservation);
    } catch (err) {
      next(err);
    }
  }

  // Público: cancelar reserva por folio o CURP
  async cancelarPorCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const { busqueda } = z.object({ busqueda: z.string().min(8) }).parse(req.body);
      await reservationService.cancelarPorCliente(busqueda);
      sendSuccess(res, null, 'Tu reserva fue cancelada exitosamente.');
    } catch (err) {
      next(err);
    }
  }
}

export const reservationController = new ReservationController();
