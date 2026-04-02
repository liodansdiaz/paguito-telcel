import { Router } from 'express';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';
import { adminLogsController } from './admin.logs.controller';

const router = Router();

// Todas las rutas requieren autenticación de ADMIN
router.use(authenticate, requireRole('ADMIN'));

router.get('/files', adminLogsController.getLogFiles.bind(adminLogsController));
router.get('/stats', adminLogsController.getStats.bind(adminLogsController));
router.get('/download/:filename', adminLogsController.downloadLog.bind(adminLogsController));
router.get('/', adminLogsController.getLogs.bind(adminLogsController));

export default router;
