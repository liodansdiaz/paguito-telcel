import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { systemConfigService } from './system-config.service';
import { sendSuccess } from '../../shared/utils/response.helper';
import { restartSummaryScheduler } from '../../shared/services/summary-scheduler.service';

// Schema para validar actualización de configuración
const updateConfigSchema = z.object({
  clave: z.string().min(1, 'La clave es requerida'),
  valor: z.string().min(1, 'El valor es requerido'),
});

// Schema para actualización masiva
const bulkUpdateSchema = z.array(
  z.object({
    clave: z.string().min(1),
    valor: z.string().min(1),
  })
);

export class SystemConfigController {
  /**
   * Obtiene todas las configuraciones del sistema
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const configs = await systemConfigService.getAll();
      sendSuccess(res, configs);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Obtiene una configuración por su clave
   */
  async getByClave(req: Request, res: Response, next: NextFunction) {
    try {
      const clave = req.params.clave as string;
      const config = await systemConfigService.getByClave(clave);
      sendSuccess(res, config);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Actualiza una configuración específica
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateConfigSchema.parse(req.body);
      const userId = req.user?.userId;
      const config = await systemConfigService.update(dto.clave, dto.valor, userId);
      sendSuccess(res, config, 'Configuración actualizada');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Actualiza múltiples configuraciones a la vez
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = bulkUpdateSchema.parse(req.body);
      const userId = req.user?.userId;
      const configs = await systemConfigService.bulkUpdate(dto, userId);
      sendSuccess(res, configs, 'Configuraciones actualizadas');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Obtiene la configuración de notificaciones (vista consolidada)
   */
  async getNotificacionesConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await systemConfigService.getNotificacionesConfig();
      sendSuccess(res, config);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Obtiene la configuración del resumen diario
   */
  async getResumenConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await systemConfigService.getResumenConfig();
      sendSuccess(res, config);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Actualiza la configuración de notificaciones
   */
  async updateNotificacionesConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        whatsappCliente: z.boolean().optional(),
        whatsappVendedor: z.boolean().optional(),
      });
      const dto = schema.partial().parse(req.body);
      const userId = req.user?.userId;
      const config = await systemConfigService.updateNotificacionesConfig(dto, userId);
      
      // Reiniciar scheduler del resumen después de actualizar config
      // (aunque cambio de notificaciones no afecta el resumen, es buena práctica)
      await restartSummaryScheduler();
      
      sendSuccess(res, config, 'Configuración de notificaciones actualizada');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Actualiza la configuración del resumen diario
   */
  async updateResumenConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        habilitado: z.boolean().optional(),
        frecuencia: z.enum(['diario', 'cada_2_dias', 'semanal']).optional(),
        hora: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)').optional(),
        diaSemana: z.number().min(1).max(7).optional(),
        adminIds: z.array(z.string()).optional(),
      });
      const dto = schema.partial().parse(req.body);
      const userId = req.user?.userId;
      const config = await systemConfigService.updateResumenConfig(dto, userId);
      
      // Reiniciar scheduler del resumen después de actualizar config
      await restartSummaryScheduler();
      
      sendSuccess(res, config, 'Configuración del resumen diario actualizada');
    } catch (err) {
      next(err);
    }
  }
}

export const systemConfigController = new SystemConfigController();
