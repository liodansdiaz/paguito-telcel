import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../shared/utils/response.helper';
import { CacheService } from '../../shared/services/cache.service';
import { isRedisAvailable } from '../../config/redis';

export class DashboardController {
  async getAdminMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const metrics = await dashboardService.getAdminMetrics({
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      });
      sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }

  async getChartData(req: Request, res: Response, next: NextFunction) {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const data = await dashboardService.getChartData({
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getStatusDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const data = await dashboardService.getStatusDistribution({
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getVendorRanking(req: Request, res: Response, next: NextFunction) {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const data = await dashboardService.getVendorRanking({
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getVendorDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getVendorDashboard(req.user!.userId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getCacheMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const isAvailable = await isRedisAvailable();
      const metrics = CacheService.getMetrics();
      const info = await CacheService.getInfo();

      const data = {
        enabled: isAvailable,
        metrics,
        redis: isAvailable ? {
          usedMemory: info?.used_memory_human || 'N/A',
          connectedClients: info?.connected_clients || 'N/A',
          uptime: info?.uptime_in_seconds ? `${Math.floor(Number(info.uptime_in_seconds) / 60)} min` : 'N/A',
          version: info?.redis_version || 'N/A',
        } : null,
      };

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
