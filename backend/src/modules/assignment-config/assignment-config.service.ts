import { prisma } from '../../config/database';
import { assignmentService } from '../../shared/services/assignment.service';
import { AppError } from '../../shared/middleware/error.middleware';
import { EstrategiaAsignacion } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

export class AssignmentConfigService {
  /**
   * Obtiene la configuración de asignación actual
   */
  async getConfig() {
    const config = await prisma.configuracionAsignacion.findFirst({
      orderBy: { id: 'desc' },
      include: {
        actualizadoPorUser: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!config) {
      // Crear configuración por defecto si no existe
      const newConfig = await prisma.configuracionAsignacion.create({
        data: {
          estrategia: 'ROUND_ROBIN',
        },
      });

      logger.info('Configuración de asignación creada con estrategia por defecto: ROUND_ROBIN');

      return {
        estrategia: newConfig.estrategia,
        actualizadoEn: newConfig.actualizadoEn,
        actualizadoPor: null,
      };
    }

    return {
      estrategia: config.estrategia,
      actualizadoEn: config.actualizadoEn,
      actualizadoPor: config.actualizadoPorUser
        ? {
            id: config.actualizadoPorUser.id,
            nombre: config.actualizadoPorUser.nombre,
          }
        : null,
    };
  }

  /**
   * Actualiza la estrategia de asignación
   */
  async updateConfig(estrategia: EstrategiaAsignacion, adminId: string) {
    // Validar que la estrategia es válida
    if (!['ROUND_ROBIN', 'MANUAL'].includes(estrategia)) {
      throw new AppError('Estrategia de asignación no válida', 400);
    }

    // Obtener configuración actual para logging
    const currentConfig = await prisma.configuracionAsignacion.findFirst({
      orderBy: { id: 'desc' },
    });

    // Crear nuevo registro de configuración
    const updated = await prisma.configuracionAsignacion.create({
      data: {
        estrategia,
        actualizadoPor: adminId,
      },
      include: {
        actualizadoPorUser: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    // Invalidar cache del servicio de asignación
    assignmentService.invalidateCache();

    logger.info(
      `Configuración de asignación actualizada: ${currentConfig?.estrategia || 'N/A'} → ${estrategia} por admin ${adminId}`
    );

    return {
      estrategia: updated.estrategia,
      actualizadoEn: updated.actualizadoEn,
      actualizadoPor: updated.actualizadoPorUser
        ? {
            id: updated.actualizadoPorUser.id,
            nombre: updated.actualizadoPorUser.nombre,
          }
        : null,
    };
  }

  /**
   * Obtiene la lista de estrategias disponibles con sus descripciones
   */
  getAvailableStrategies() {
    return [
      {
        value: 'ROUND_ROBIN' as EstrategiaAsignacion,
        label: 'Round Robin (Automático)',
        description:
          'Las reservas se asignan automáticamente al vendedor que hace más tiempo que no recibe una reserva. Distribución equitativa de carga.',
      },
      {
        value: 'MANUAL' as EstrategiaAsignacion,
        label: 'Asignación Manual',
        description:
          'Las reservas quedan sin asignar hasta que un administrador las asigne manualmente desde el panel. Control total sobre cada asignación.',
      },
    ];
  }
}

export const assignmentConfigService = new AssignmentConfigService();
