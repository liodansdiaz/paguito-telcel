import { Request, Response, NextFunction } from 'express';
import { chatMetricsService } from '../../shared/services/chat-metrics.service';
import { sendSuccess } from '../../shared/utils/response.helper';

/**
 * AdminChatMetricsController
 * 
 * Controlador para ver métricas del chat (solo admin)
 */
export class AdminChatMetricsController {
  /**
   * GET /api/admin/chat-metrics
   * Obtiene métricas del chat (hoy + mes)
   */
  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const [todayMetrics, monthMetrics, limits] = await Promise.all([
        chatMetricsService.getTodayMetrics(),
        chatMetricsService.getMonthMetrics(),
        Promise.resolve(chatMetricsService.getLimits()),
      ]);

      const data = {
        today: {
          ...todayMetrics,
          costFormatted: `$${todayMetrics.cost.toFixed(2)}`,
          tokensFormatted: `${(todayMetrics.tokens / 1000).toFixed(1)}K`,
        },
        month: {
          ...monthMetrics,
          costFormatted: `$${monthMetrics.cost.toFixed(2)}`,
          tokensFormatted: `${(monthMetrics.tokens / 1000).toFixed(1)}K`,
        },
        limits: {
          ...limits,
          maxCostPerDayFormatted: `$${limits.maxCostPerDay.toFixed(2)}`,
          maxCostPerMonthFormatted: `$${limits.maxCostPerMonth.toFixed(2)}`,
          alertThresholdPercent: `${(limits.alertThreshold * 100).toFixed(0)}%`,
        },
        status: {
          withinDailyLimit: todayMetrics.cost < limits.maxCostPerDay,
          withinMonthlyLimit: monthMetrics.cost < limits.maxCostPerMonth,
          dailyLimitPercentage: ((todayMetrics.cost / limits.maxCostPerDay) * 100).toFixed(1),
          monthlyLimitPercentage: ((monthMetrics.cost / limits.maxCostPerMonth) * 100).toFixed(1),
        },
      };

      sendSuccess(res, data, 'Métricas del chat obtenidas correctamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/chat-metrics/status
   * Verifica si el chat está habilitado según los límites
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const isEnabled = await chatMetricsService.isChatEnabled();
      const todayMetrics = await chatMetricsService.getTodayMetrics();
      const monthMetrics = await chatMetricsService.getMonthMetrics();
      const limits = chatMetricsService.getLimits();

      sendSuccess(res, {
        enabled: isEnabled,
        reason: !isEnabled 
          ? (todayMetrics.cost >= limits.maxCostPerDay 
              ? 'Límite diario excedido' 
              : 'Límite mensual excedido')
          : null,
        todayCost: todayMetrics.cost,
        monthCost: monthMetrics.cost,
      }, isEnabled ? 'Chat habilitado' : 'Chat deshabilitado por límite de costo');
    } catch (err) {
      next(err);
    }
  }
}

export const adminChatMetricsController = new AdminChatMetricsController();
