import cron, { ScheduledTask } from 'node-cron';
import { logger } from '../utils/logger';
import { systemConfigService } from '../../modules/system-config/system-config.service';
import { DailySummaryService } from './daily-summary.service';

let summaryCronJob: ScheduledTask | null = null;

/**
 * Inicia el scheduler para el resumen diario.
 * Lee la configuración de la base de datos y programa el cron accordingly.
 */
export async function startSummaryScheduler(): Promise<void> {
  // Cancelar cualquier job existente
  if (summaryCronJob) {
    summaryCronJob.stop();
    summaryCronJob = null;
  }

  try {
    const config = await systemConfigService.getResumenConfig();

    if (!config.habilitado) {
      logger.info('SummaryScheduler: resumen deshabilitado, no se programara envio automatico');
      return;
    }

    // Programar según la frecuencia
    const [hora, minuto] = config.hora.split(':').map(Number);
    let cronExpression: string;

    switch (config.frecuencia) {
      case 'diario':
        // Todos los días a la hora configurada
        cronExpression = `${minuto} ${hora} * * *`;
        break;

      case 'cada_2_dias':
        // Días pares (incluye 0 = todos los días en algunos sistemas, usaremos workaround)
        // Usamos día del mes par: cada 2 días
        // Para simplificar, usaremos la misma hora pero con lógica adicional en el servicio
        cronExpression = `${minuto} ${hora} * * *`;
        break;

      case 'semanal':
        // Día específico de la semana (1=lunes, 7=domingo)
        // cron: minuto hora * * día_semana
        cronExpression = `${minuto} ${hora} * * ${config.diaSemana}`;
        break;

      default:
        cronExpression = `${minuto} ${hora} * * *`;
    }

    summaryCronJob = cron.schedule(cronExpression, async () => {
      logger.info('SummaryScheduler: ejecutando resumen segun programacion...');
      await DailySummaryService.sendDailySummary();
    });

    logger.info(`SummaryScheduler iniciado: frecuencia=${config.frecuencia}, hora=${config.hora}, diaSemana=${config.diaSemana || 'N/A'}`);
  } catch (error) {
    logger.error('Error iniciando SummaryScheduler:', error);
    // En caso de error, programar por defecto a las 9:00
    summaryCronJob = cron.schedule('0 9 * * *', async () => {
      await DailySummaryService.sendDailySummary();
    });
    logger.info('SummaryScheduler iniciado con configuracion por defecto (9:00 diario)');
  }
}

/**
 * Detiene el scheduler del resumen diario.
 */
export function stopSummaryScheduler(): void {
  if (summaryCronJob) {
    summaryCronJob.stop();
    summaryCronJob = null;
    logger.info('SummaryScheduler detenido');
  }
}

/**
 * Reinicia el scheduler (útil después de un cambio de configuración).
 */
export async function restartSummaryScheduler(): Promise<void> {
  logger.info('SummaryScheduler: reiniciando...');
  await startSummaryScheduler();
}
