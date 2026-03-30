import { prisma } from '../../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class RoundRobinService {
  /**
   * Asigna el siguiente vendedor activo en secuencia Round Robin justa.
   * Reglas:
   * - Solo vendedores con isActive = true y rol = VENDEDOR
   * - Ordenados por lastAssignedAt ASC NULLS FIRST (el que lleva más tiempo sin asignación va primero)
   * - Registra lastAssignedAt al asignar
   */
  static async getNextVendor(): Promise<string> {
    // Obtener el vendedor activo que más tiempo lleva sin asignación (LIMIT 1)
    const selectedVendor = await prisma.user.findFirst({
      where: {
        isActive: true,
        rol: 'VENDEDOR',
      },
      orderBy: [
        { lastAssignedAt: { sort: 'asc', nulls: 'first' } },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });

    if (!selectedVendor) {
      logger.warn('Round Robin: No hay vendedores activos disponibles');
      throw new AppError(
        'No hay vendedores activos disponibles. Contacta al administrador.',
        503
      );
    }

    // Actualizar su lastAssignedAt
    await prisma.user.update({
      where: { id: selectedVendor.id },
      data: { lastAssignedAt: new Date() },
    });

    logger.info(`Round Robin: Vendedor asignado - ${selectedVendor.nombre} (${selectedVendor.id})`);

    return selectedVendor.id;
  }

  /**
   * Placeholder para futura asignación por cercanía geográfica.
   * La interfaz ya está preparada para intercambiar estrategias.
   */
  static async getNearestVendor(
    _latitude: number,
    _longitude: number
  ): Promise<string> {
    // TODO: Implementar cuando se active Google Maps API avanzada
    // 1. Obtener ubicaciones de vendedores activos
    // 2. Calcular distancia haversine
    // 3. Retornar el más cercano
    logger.warn('getNearestVendor: No implementado aún, usando Round Robin');
    return this.getNextVendor();
  }
}
