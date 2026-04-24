import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reservationService } from './reservation.service';
import { assignmentService } from '../../shared/services/assignment.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.helper';
import { EstadoReserva, EstadoReservaItem } from '@prisma/client';
// Importar DTOs
import { 
  createReservationSchema,
  consultaReservaSchema,
  cancelarReservaSchema as schemaCancelar,
  modificarReservaSchema,
  updateStatusSchema,
  updateItemStatusSchema,
  assignVendorSchema,
} from '../../dtos';

export class ReservationController {
  /**
   * Crear reserva con carrito multi-producto — ruta pública
   * POST /api/reservations
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createReservationSchema.parse(req.body);
      const reservation = await reservationService.createReservation(dto);
      sendSuccess(res, reservation, 'Reserva creada exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: listado de todas las reservas con filtros
   * GET /api/reservations
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, vendorId, search, fechaDesde, fechaHasta, tipoPago, producto, page, limit } = req.query;
      const result = await reservationService.getAll({
        estado: estado as EstadoReserva,
        vendorId: vendorId as string,
        search: search as string,
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
        tipoPago: tipoPago as 'CONTADO' | 'CREDITO' | undefined,
        producto: producto as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      sendPaginated(res, result.data, result.total, parseInt((page as string) || '1'), parseInt((limit as string) || '20'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Obtener reserva por ID con todos sus items
   * GET /api/reservations/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await reservationService.getById(req.params['id'] as string);
      sendSuccess(res, reservation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Actualizar estado general de la reserva
   * PATCH /api/reservations/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, notas } = updateStatusSchema.parse(req.body);
      const reservation = await reservationService.updateStatus(req.params['id'] as string, estado, notas);
      sendSuccess(res, reservation, 'Estado actualizado');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Asignar o reasignar vendedor
   * PATCH /api/reservations/:id/vendor
   */
  async assignVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = z.object({ vendorId: z.string().uuid() }).parse(req.body);
      const reservation = await reservationService.assignVendor(req.params['id'] as string, vendorId);
      sendSuccess(res, reservation, 'Vendedor asignado');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Asignar vendedor manualmente (modo manual) - Solo ADMIN
   * PATCH /api/admin/reservations/:id/assign-vendor
   */
  async assignVendorManually(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = z.object({ vendorId: z.string().uuid() }).parse(req.body);
      const adminId = req.user!.userId; // Del middleware authenticate

      await assignmentService.assignManually(req.params['id'] as string, vendorId, adminId);

      // Obtener datos actualizados de la reserva
      const reservation = await reservationService.getById(req.params['id'] as string);

      sendSuccess(res, reservation, 'Vendedor asignado correctamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Actualizar estado de un item individual
   * PATCH /api/reservations/items/:itemId/status
   */
  async updateItemStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, notas } = updateItemStatusSchema.parse(req.body);
      const item = await reservationService.updateItemStatus(req.params['itemId'] as string, estado, notas);
      sendSuccess(res, item, 'Estado del item actualizado');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Marcar item como VENDIDO (decrementa stock)
   * POST /api/reservations/items/:itemId/sold
   */
  async markItemAsSold(req: Request, res: Response, next: NextFunction) {
    try {
      const { notas } = z.object({ notas: z.string().optional() }).parse(req.body);
      const item = await reservationService.markItemAsSold(req.params['itemId'] as string, notas);
      sendSuccess(res, item, 'Producto marcado como vendido');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancelar un item individual (admin/vendedor)
   * POST /api/reservations/items/:itemId/cancel
   */
  async cancelItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { notas } = z.object({ notas: z.string().optional() }).parse(req.body);
      const item = await reservationService.cancelItem(req.params['itemId'] as string, notas);
      sendSuccess(res, item, 'Producto cancelado');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancelar toda la reserva (admin/vendedor)
   * POST /api/reservations/:id/cancel
   */
  async cancelReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const { notas } = z.object({ notas: z.string().optional() }).parse(req.body);
      const reservation = await reservationService.cancelReservation(req.params['id'] as string, notas);
      sendSuccess(res, reservation, 'Reserva cancelada');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Eliminar físicamente una reserva (admin)
   * DELETE /api/reservations/admin/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await reservationService.delete(req.params['id'] as string);
      sendSuccess(res, null, 'Reserva eliminada correctamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Obtener un item específico
   * GET /api/reservations/items/:itemId
   */
  async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await reservationService.getItemById(req.params['itemId'] as string);
      sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Vendedor: obtener mis reservas
   * GET /api/reservations/vendor/my-reservations
   */
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

  /**
   * Vendedor: obtener datos para mapa
   * GET /api/reservations/vendor/map-data
   */
  async getMyMapData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reservationService.getVendorMapData(req.user!.userId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Público: consultar reserva por folio o CURP
   * POST /api/reservations/consulta
   */
  async consulta(req: Request, res: Response, next: NextFunction) {
    try {
      const { busqueda } = z.object({ busqueda: z.string().min(8) }).parse(req.body);
      const reservation = await reservationService.consultarReserva(busqueda);
      sendSuccess(res, reservation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Público: cancelar reserva completa o item individual por folio o CURP
   * POST /api/reservations/cancelar
   * 
   * Body:
   * - busqueda: folio o CURP (requerido)
   * - itemId: UUID del item (opcional, si se proporciona cancela solo ese item)
   */
  async cancelarPorCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const { busqueda, itemId } = schemaCancelar.parse(req.body);
      await reservationService.cancelarPorCliente(busqueda, itemId);
      
      const mensaje = itemId 
        ? 'El producto fue cancelado exitosamente.'
        : 'Tu reserva fue cancelada exitosamente.';
      
      sendSuccess(res, null, mensaje);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Público: modificar reserva (fecha, horario, dirección)
   * PUT /api/reservations/modificar
   */
  async modificar(req: Request, res: Response, next: NextFunction) {
    try {
      const { busqueda, ...campos } = modificarReservaSchema.parse(req.body);
      const reservation = await reservationService.modifyReservation(busqueda, campos);
      sendSuccess(res, reservation, 'Reserva modificada exitosamente');
    } catch (err) {
      next(err);
    }
  }
}

export const reservationController = new ReservationController();
