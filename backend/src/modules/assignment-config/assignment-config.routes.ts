import { Router } from 'express';
import { assignmentConfigController } from './assignment-config.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);
router.use(requireRole('ADMIN'));

// GET /api/admin/assignment-config - Obtener configuración actual
router.get('/', assignmentConfigController.getConfig.bind(assignmentConfigController));

// PUT /api/admin/assignment-config - Actualizar configuración
router.put('/', assignmentConfigController.updateConfig.bind(assignmentConfigController));

// GET /api/admin/assignment-strategies - Listar estrategias disponibles
router.get('/strategies', assignmentConfigController.getStrategies.bind(assignmentConfigController));

export default router;
