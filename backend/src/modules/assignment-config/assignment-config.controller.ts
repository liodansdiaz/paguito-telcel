import { Request, Response, NextFunction } from 'express';
import { assignmentConfigService } from './assignment-config.service';
import { sendSuccess } from '../../shared/utils/response.helper';
import { z } from 'zod';

const updateConfigSchema = z.object({
  estrategia: z.enum(['ROUND_ROBIN', 'MANUAL'], {
    message: 'Estrategia debe ser ROUND_ROBIN o MANUAL',
  }),
});

export class AssignmentConfigController {
  /**
   * GET /api/admin/assignment-config
   * Obtener configuración actual
   */
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await assignmentConfigService.getConfig();
      sendSuccess(res, config, 'Configuración obtenida');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/assignment-config
   * Actualizar estrategia de asignación (solo ADMIN)
   */
  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { estrategia } = updateConfigSchema.parse(req.body);
      const adminId = req.user!.userId; // Del middleware authenticate + requireRole('ADMIN')

      const updated = await assignmentConfigService.updateConfig(estrategia, adminId);

      sendSuccess(res, updated, 'Configuración actualizada correctamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/assignment-strategies
   * Listar estrategias disponibles
   */
  async getStrategies(req: Request, res: Response, next: NextFunction) {
    try {
      const strategies = assignmentConfigService.getAvailableStrategies();
      sendSuccess(res, strategies, 'Estrategias disponibles');
    } catch (err) {
      next(err);
    }
  }
}

export const assignmentConfigController = new AssignmentConfigController();
