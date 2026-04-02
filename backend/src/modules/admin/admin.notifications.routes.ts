import { Router } from 'express';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';
import { adminNotificationsController } from './admin.notifications.controller';

const router = Router();

// Todas las rutas requieren autenticación de ADMIN
router.use(authenticate, requireRole('ADMIN'));

router.get('/', adminNotificationsController.getAll.bind(adminNotificationsController));
router.get('/stats', adminNotificationsController.getStats.bind(adminNotificationsController));
router.get('/:id', adminNotificationsController.getById.bind(adminNotificationsController));

export default router;
