import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import { logger } from '../../shared/utils/logger';
import { invalidateNotificacionesCache } from '../../shared/services/notificaciones-config.service';

// Claves de configuración del sistema
export const CONFIG_KEYS = {
  WHATSAPP_CLIENTE: 'whatsapp_cliente',
  WHATSAPP_VENDEDOR: 'whatsapp_vendedor',
  EMAIL_RESUMEN_HABILITADO: 'email_resumen_habilitado',
  EMAIL_RESUMEN_FRECUENCIA: 'email_resumen_frecuencia',
  EMAIL_RESUMEN_HORA: 'email_resumen_hora',
  EMAIL_RESUMEN_DIA_SEMANA: 'email_resumen_dia_semana',
  EMAIL_RESUMEN_ADMIN_IDS: 'email_resumen_admin_ids',
} as const;

// Valores por defecto
const DEFAULT_CONFIG: Record<string, string> = {
  [CONFIG_KEYS.WHATSAPP_CLIENTE]: 'true',
  [CONFIG_KEYS.WHATSAPP_VENDEDOR]: 'true',
  [CONFIG_KEYS.EMAIL_RESUMEN_HABILITADO]: 'true',
  [CONFIG_KEYS.EMAIL_RESUMEN_FRECUENCIA]: 'diario',
  [CONFIG_KEYS.EMAIL_RESUMEN_HORA]: '09:00',
  [CONFIG_KEYS.EMAIL_RESUMEN_DIA_SEMANA]: '1', // Lunes por defecto
  [CONFIG_KEYS.EMAIL_RESUMEN_ADMIN_IDS]: '[]',
};

export class SystemConfigService {
  /**
   * Obtiene todas las configuraciones, inicializando las que no existan
   */
  async getAll(): Promise<Array<{ clave: string; valor: string }>> {
    // Obtener todas las configuraciones existentes
    const configs = await prisma.systemConfig.findMany({
      orderBy: { clave: 'asc' },
    });

    // Verificar si hay configs que no existen y crearlas con valores por defecto
    const missingKeys = Object.keys(DEFAULT_CONFIG).filter(
      key => !configs.some(c => c.clave === key)
    );

    if (missingKeys.length > 0) {
      const defaultConfigs = missingKeys.map(clave => ({
        clave,
        valor: DEFAULT_CONFIG[clave],
      }));

      await prisma.systemConfig.createMany({
        data: defaultConfigs,
      });

      // Combinar existentes con nuevos
      return [...configs, ...defaultConfigs].map(c => ({
        clave: c.clave,
        valor: c.valor,
      }));
    }

    return configs.map(c => ({ clave: c.clave, valor: c.valor }));
  }

  /**
   * Obtiene una configuración por clave
   * Si no existe, la crea con el valor por defecto
   */
  async getByClave(clave: string): Promise<{ clave: string; valor: string }> {
    const existing = await prisma.systemConfig.findUnique({
      where: { clave },
    });

    if (existing) {
      return { clave: existing.clave, valor: existing.valor };
    }

    // Si no existe y tiene valor por defecto, crearla
    if (DEFAULT_CONFIG[clave]) {
      const created = await prisma.systemConfig.create({
        data: {
          clave,
          valor: DEFAULT_CONFIG[clave],
        },
      });
      return { clave: created.clave, valor: created.valor };
    }

    // Si no existe y no tiene valor por defecto, devolver cadena vacía
    return { clave, valor: '' };
  }

  /**
   * Obtiene el valor de una configuración como boolean
   */
  async getBoolean(clave: string): Promise<boolean> {
    const config = await this.getByClave(clave);
    return config?.valor === 'true';
  }

  /**
   * Obtiene el valor de una configuración como string
   */
  async getString(clave: string): Promise<string | null> {
    const config = await this.getByClave(clave);
    return config?.valor || null;
  }

  /**
   * Actualiza una configuración
   */
  async update(
    clave: string,
    valor: string,
    actualizadoPor?: string
  ): Promise<{ clave: string; valor: string }> {
    if (!DEFAULT_CONFIG[clave]) {
      throw new AppError(`Clave de configuración inválida: ${clave}`, 400);
    }

    const config = await prisma.systemConfig.upsert({
      where: { clave },
      create: {
        clave,
        valor,
        actualizadoPor,
      },
      update: {
        valor,
        actualizadoPor,
      },
    });

    // Invalidar caché de notificaciones cuando se actualiza configuración relevante
    if (clave === CONFIG_KEYS.WHATSAPP_CLIENTE || clave === CONFIG_KEYS.WHATSAPP_VENDEDOR) {
      invalidateNotificacionesCache();
    }

    logger.info(`Configuración actualizada: ${clave} = ${valor}`);
    return { clave: config.clave, valor: config.valor };
  }

  /**
   * Actualiza múltiples configuraciones
   */
  async bulkUpdate(
    configs: Array<{ clave: string; valor: string }>,
    actualizadoPor?: string
  ): Promise<Array<{ clave: string; valor: string }>> {
    const results: Array<{ clave: string; valor: string }> = [];
    let invalidateCache = false;

    for (const { clave, valor } of configs) {
      if (!DEFAULT_CONFIG[clave]) {
        logger.warn(`Clave ignorada (inválida): ${clave}`);
        continue;
      }

      const config = await prisma.systemConfig.upsert({
        where: { clave },
        create: {
          clave,
          valor,
          actualizadoPor,
        },
        update: {
          valor,
          actualizadoPor,
        },
      });

      results.push({ clave: config.clave, valor: config.valor });
      logger.info(`Configuración actualizada en bulk: ${clave} = ${valor}`);

      // Verificar si necesitamos invalidar caché
      if (clave === CONFIG_KEYS.WHATSAPP_CLIENTE || clave === CONFIG_KEYS.WHATSAPP_VENDEDOR) {
        invalidateCache = true;
      }
    }

    // Invalidar caché si se actualizó configuración de WhatsApp
    if (invalidateCache) {
      invalidateNotificacionesCache();
    }

    return results;
  }

  /**
   * Obtiene la configuración consolidada de notificaciones
   */
  async getNotificacionesConfig(): Promise<{
    whatsappCliente: boolean;
    whatsappVendedor: boolean;
  }> {
    const [whatsappCliente, whatsappVendedor] = await Promise.all([
      this.getBoolean(CONFIG_KEYS.WHATSAPP_CLIENTE),
      this.getBoolean(CONFIG_KEYS.WHATSAPP_VENDEDOR),
    ]);

    return {
      whatsappCliente,
      whatsappVendedor,
    };
  }

  /**
   * Actualiza la configuración de notificaciones
   */
  async updateNotificacionesConfig(
    dto: {
      whatsappCliente?: boolean;
      whatsappVendedor?: boolean;
    },
    actualizadoPor?: string
  ): Promise<{
    whatsappCliente: boolean;
    whatsappVendedor: boolean;
  }> {
    const updates: Array<{ clave: string; valor: string }> = [];

    if (dto.whatsappCliente !== undefined) {
      updates.push({
        clave: CONFIG_KEYS.WHATSAPP_CLIENTE,
        valor: dto.whatsappCliente.toString(),
      });
    }

    if (dto.whatsappVendedor !== undefined) {
      updates.push({
        clave: CONFIG_KEYS.WHATSAPP_VENDEDOR,
        valor: dto.whatsappVendedor.toString(),
      });
    }

    if (updates.length > 0) {
      await this.bulkUpdate(updates, actualizadoPor);
    }

    // Invalidar caché después de actualizar
    invalidateNotificacionesCache();

    return this.getNotificacionesConfig();
  }

  /**
   * Obtiene la configuración del resumen diario
   */
  async getResumenConfig(): Promise<{
    habilitado: boolean;
    frecuencia: string;
    hora: string;
    diaSemana: number;
    adminIds: string[];
  }> {
    const [habilitado, frecuencia, hora, diaSemana, adminIdsStr] = await Promise.all([
      this.getBoolean(CONFIG_KEYS.EMAIL_RESUMEN_HABILITADO),
      this.getString(CONFIG_KEYS.EMAIL_RESUMEN_FRECUENCIA),
      this.getString(CONFIG_KEYS.EMAIL_RESUMEN_HORA),
      this.getString(CONFIG_KEYS.EMAIL_RESUMEN_DIA_SEMANA),
      this.getString(CONFIG_KEYS.EMAIL_RESUMEN_ADMIN_IDS),
    ]);

    let adminIds: string[] = [];
    try {
      adminIds = adminIdsStr ? JSON.parse(adminIdsStr) : [];
    } catch {
      adminIds = [];
    }

    return {
      habilitado: habilitado ?? true,
      frecuencia: frecuencia ?? 'diario',
      hora: hora ?? '09:00',
      diaSemana: parseInt(diaSemana ?? '1', 10),
      adminIds,
    };
  }

  /**
   * Actualiza la configuración del resumen diario
   */
  async updateResumenConfig(
    dto: {
      habilitado?: boolean;
      frecuencia?: 'diario' | 'cada_2_dias' | 'semanal';
      hora?: string;
      diaSemana?: number;
      adminIds?: string[];
    },
    actualizadoPor?: string
  ): Promise<{
    habilitado: boolean;
    frecuencia: string;
    hora: string;
    diaSemana: number;
    adminIds: string[];
  }> {
    const updates: Array<{ clave: string; valor: string }> = [];

    if (dto.habilitado !== undefined) {
      updates.push({
        clave: CONFIG_KEYS.EMAIL_RESUMEN_HABILITADO,
        valor: dto.habilitado.toString(),
      });
    }

    if (dto.frecuencia !== undefined) {
      updates.push({
        clave: CONFIG_KEYS.EMAIL_RESUMEN_FRECUENCIA,
        valor: dto.frecuencia,
      });
    }

    if (dto.hora !== undefined) {
      // Validar formato HH:MM
      if (!/^\d{2}:\d{2}$/.test(dto.hora)) {
        throw new AppError('Formato de hora inválido. Use HH:MM', 400);
      }
      updates.push({
        clave: CONFIG_KEYS.EMAIL_RESUMEN_HORA,
        valor: dto.hora,
      });
    }

    if (dto.diaSemana !== undefined) {
      if (dto.diaSemana < 1 || dto.diaSemana > 7) {
        throw new AppError('Día de la semana inválido. Use 1-7 (1=lunes)', 400);
      }
      updates.push({
        clave: CONFIG_KEYS.EMAIL_RESUMEN_DIA_SEMANA,
        valor: dto.diaSemana.toString(),
      });
    }

    if (dto.adminIds !== undefined) {
      updates.push({
        clave: CONFIG_KEYS.EMAIL_RESUMEN_ADMIN_IDS,
        valor: JSON.stringify(dto.adminIds),
      });
    }

    if (updates.length > 0) {
      await this.bulkUpdate(updates, actualizadoPor);
    }

    return this.getResumenConfig();
  }
}

export const systemConfigService = new SystemConfigService();
