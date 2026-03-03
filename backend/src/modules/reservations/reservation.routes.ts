import { Router } from 'express';
import { reservationController } from './reservation.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';
import { reservationLimiter } from '../../config/rateLimit';

const router = Router();

// Ruta pública — crear reserva
router.post('/', reservationLimiter, reservationController.create.bind(reservationController));

// Admin
router.get('/admin', authenticate, requireRole('ADMIN'), reservationController.getAll.bind(reservationController));
router.get('/admin/:id', authenticate, requireRole('ADMIN'), reservationController.getById.bind(reservationController));
router.patch('/admin/:id/status', authenticate, requireRole('ADMIN'), reservationController.updateStatus.bind(reservationController));
router.patch('/admin/:id/assign', authenticate, requireRole('ADMIN'), reservationController.assignVendor.bind(reservationController));

// Vendedor
router.get('/vendor/my', authenticate, requireRole('VENDEDOR', 'ADMIN'), reservationController.getMyReservations.bind(reservationController));
router.patch('/vendor/:id/status', authenticate, requireRole('VENDEDOR', 'ADMIN'), reservationController.updateStatus.bind(reservationController));
router.get('/vendor/map', authenticate, requireRole('VENDEDOR', 'ADMIN'), reservationController.getMyMapData.bind(reservationController));

export default router;
