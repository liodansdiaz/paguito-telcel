import { Router } from 'express';
import { reservationController } from './reservation.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';
import { reservationLimiter, consultaLimiter, cancelarLimiter } from '../../config/rateLimit';

const router = Router();

// =====================================================================
// RUTAS PÚBLICAS
// =====================================================================

/**
 * Crear nueva reserva con carrito multi-producto
 * POST /api/reservations
 */
router.post('/', reservationLimiter, reservationController.create.bind(reservationController));

/**
 * Consultar reserva por folio o CURP
 * POST /api/reservations/consulta
 */
router.post('/consulta', consultaLimiter, reservationController.consulta.bind(reservationController));

/**
 * Cancelar reserva completa o item individual
 * POST /api/reservations/cancelar
 * Body: { busqueda: string, itemId?: string }
 */
router.post('/cancelar', cancelarLimiter, reservationController.cancelarPorCliente.bind(reservationController));

/**
 * Modificar reserva (fecha, horario, dirección)
 * PUT /api/reservations/modificar
 * Body: { busqueda: string, fechaPreferida?, horarioPreferido?, direccion?, latitude?, longitude? }
 */
router.put('/modificar', cancelarLimiter, reservationController.modificar.bind(reservationController));

// =====================================================================
// RUTAS DE ADMIN
// =====================================================================

/**
 * Obtener todas las reservas con filtros
 * GET /api/reservations/admin
 */
router.get('/admin', authenticate, requireRole('ADMIN'), reservationController.getAll.bind(reservationController));

/**
 * Obtener reserva por ID
 * GET /api/reservations/admin/:id
 */
router.get('/admin/:id', authenticate, requireRole('ADMIN'), reservationController.getById.bind(reservationController));

/**
 * Actualizar estado general de la reserva
 * PATCH /api/reservations/admin/:id/status
 */
router.patch('/admin/:id/status', authenticate, requireRole('ADMIN'), reservationController.updateStatus.bind(reservationController));

/**
 * Asignar o reasignar vendedor
 * PATCH /api/reservations/admin/:id/assign
 */
router.patch('/admin/:id/assign', authenticate, requireRole('ADMIN'), reservationController.assignVendor.bind(reservationController));

/**
 * Cancelar reserva completa
 * POST /api/reservations/admin/:id/cancel
 */
router.post('/admin/:id/cancel', authenticate, requireRole('ADMIN'), reservationController.cancelReservation.bind(reservationController));

/**
 * Eliminar físicamente una reserva
 * DELETE /api/reservations/admin/:id
 */
router.delete('/admin/:id', authenticate, requireRole('ADMIN'), reservationController.delete.bind(reservationController));

// =====================================================================
// RUTAS DE ITEMS (ADMIN Y VENDEDOR)
// =====================================================================

/**
 * Obtener item por ID
 * GET /api/reservations/items/:itemId
 */
router.get('/items/:itemId', authenticate, requireRole('ADMIN', 'VENDEDOR'), reservationController.getItemById.bind(reservationController));

/**
 * Actualizar estado de un item
 * PATCH /api/reservations/items/:itemId/status
 */
router.patch('/items/:itemId/status', authenticate, requireRole('ADMIN', 'VENDEDOR'), reservationController.updateItemStatus.bind(reservationController));

/**
 * Marcar item como VENDIDO (decrementa stock)
 * POST /api/reservations/items/:itemId/sold
 */
router.post('/items/:itemId/sold', authenticate, requireRole('ADMIN', 'VENDEDOR'), reservationController.markItemAsSold.bind(reservationController));

/**
 * Cancelar item individual
 * POST /api/reservations/items/:itemId/cancel
 */
router.post('/items/:itemId/cancel', authenticate, requireRole('ADMIN', 'VENDEDOR'), reservationController.cancelItem.bind(reservationController));

// =====================================================================
// RUTAS DE VENDEDOR
// =====================================================================

/**
 * Obtener mis reservas asignadas
 * GET /api/reservations/vendor/my
 */
router.get('/vendor/my', authenticate, requireRole('VENDEDOR', 'ADMIN'), reservationController.getMyReservations.bind(reservationController));

/**
 * Actualizar estado de una de mis reservas
 * PATCH /api/reservations/vendor/:id/status
 */
router.patch('/vendor/:id/status', authenticate, requireRole('VENDEDOR', 'ADMIN'), reservationController.updateStatus.bind(reservationController));

/**
 * Obtener datos de mapa de mis reservas
 * GET /api/reservations/vendor/map
 */
router.get('/vendor/map', authenticate, requireRole('VENDEDOR', 'ADMIN'), reservationController.getMyMapData.bind(reservationController));

export default router;
