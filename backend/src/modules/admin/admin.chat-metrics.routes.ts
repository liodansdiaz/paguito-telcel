import { Router } from 'express';
import { adminChatMetricsController } from './admin.chat-metrics.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate, requireRole('ADMIN'));

router.get('/', adminChatMetricsController.getMetrics.bind(adminChatMetricsController));
router.get('/status', adminChatMetricsController.getStatus.bind(adminChatMetricsController));

export default router;
