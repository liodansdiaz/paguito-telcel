import { Router } from 'express';
import { systemConfigController } from './system-config.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate, requireRole('ADMIN'));

// Rutas generales
router.get('/', systemConfigController.getAll.bind(systemConfigController));
router.get('/clave/:clave', systemConfigController.getByClave.bind(systemConfigController));
router.put('/', systemConfigController.update.bind(systemConfigController));
router.put('/bulk', systemConfigController.bulkUpdate.bind(systemConfigController));

// Configuración de notificaciones
router.get('/notificaciones', systemConfigController.getNotificacionesConfig.bind(systemConfigController));
router.patch('/notificaciones', systemConfigController.updateNotificacionesConfig.bind(systemConfigController));

// Configuración del resumen diario
router.get('/resumen', systemConfigController.getResumenConfig.bind(systemConfigController));
router.patch('/resumen', systemConfigController.updateResumenConfig.bind(systemConfigController));

export default router;
