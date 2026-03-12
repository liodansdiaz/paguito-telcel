import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

// Admin
router.get('/admin/metrics', authenticate, requireRole('ADMIN'), dashboardController.getAdminMetrics.bind(dashboardController));
router.get('/admin/chart', authenticate, requireRole('ADMIN'), dashboardController.getChartData.bind(dashboardController));
router.get('/admin/status-distribution', authenticate, requireRole('ADMIN'), dashboardController.getStatusDistribution.bind(dashboardController));
router.get('/admin/vendor-ranking', authenticate, requireRole('ADMIN'), dashboardController.getVendorRanking.bind(dashboardController));
router.get('/admin/cache-metrics', authenticate, requireRole('ADMIN'), dashboardController.getCacheMetrics.bind(dashboardController));

// Vendedor
router.get('/vendor', authenticate, requireRole('VENDEDOR', 'ADMIN'), dashboardController.getVendorDashboard.bind(dashboardController));

export default router;
