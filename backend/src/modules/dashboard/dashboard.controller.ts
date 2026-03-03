import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../shared/utils/response.helper';

export class DashboardController {
  async getAdminMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await dashboardService.getAdminMetrics();
      sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }

  async getChartData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getChartData();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getStatusDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getStatusDistribution();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getVendorRanking(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getVendorRanking();
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
}

export const dashboardController = new DashboardController();
