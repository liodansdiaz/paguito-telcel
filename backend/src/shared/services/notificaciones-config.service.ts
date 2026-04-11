import { systemConfigService } from '../../modules/system-config/system-config.service';
import { logger } from '../utils/logger';

// Caché en memoria para la configuración de notificaciones
// Se refresca cuando el admin cambia la configuración
let cachedNotificacionesConfig: {
  whatsappCliente: boolean;
  whatsappVendedor: boolean;
  email: boolean;
  internal: boolean;
} | null = null;

let lastFetched: Date | null = null;

// TTL de 5 segundos para la caché (para que se actualice rápido)
const CACHE_TTL = 5 * 1000;

/**
 * Obtiene la configuración de notificaciones leyendo desde la DB
 * Usa caché en memoria para no saturar la base de datos
 */
export async function getNotificacionesConfig(): Promise<{
  whatsappCliente: boolean;
  whatsappVendedor: boolean;
  email: boolean;
  internal: boolean;
}> {
  const now = new Date();

  // Verificar si la caché sigue válida
  if (cachedNotificacionesConfig && lastFetched && (now.getTime() - lastFetched.getTime()) < CACHE_TTL) {
    return cachedNotificacionesConfig;
  }

  try {
    // Leer desde la DB
    const config = await systemConfigService.getNotificacionesConfig();
    logger.info(`⚙️ Config de notificaciones leída: WhatsApp Cliente=${config.whatsappCliente}, WhatsApp Vendedor=${config.whatsappVendedor}`);

    cachedNotificacionesConfig = {
      whatsappCliente: config.whatsappCliente,
      whatsappVendedor: config.whatsappVendedor,
      email: config.whatsappCliente || config.whatsappVendedor, // Por ahora email usa la misma lógica
      internal: true, // Internal siempre activo por defecto
    };

    lastFetched = now;
    return cachedNotificacionesConfig;
  } catch (error) {
    // Si falla, usar configuración por defecto de variables de entorno
    console.error('Error obteniendo notificaciones config, usando fallback:', error);
    return {
      whatsappCliente: process.env.NOTIFICATIONS_WHATSAPP === 'true',
      whatsappVendedor: process.env.NOTIFICATIONS_WHATSAPP === 'true',
      email: process.env.NOTIFICATIONS_EMAIL === 'true',
      internal: process.env.NOTIFICATIONS_INTERNAL !== 'false',
    };
  }
}

/**
 * Invalida la caché forzosamente (llamar después de actualizar config)
 */
export function invalidateNotificacionesCache(): void {
  cachedNotificacionesConfig = null;
  lastFetched = null;
}

/**
 * Obtiene si está habilitado el WhatsApp para clientes
 */
export async function isWhatsappClienteEnabled(): Promise<boolean> {
  const config = await getNotificacionesConfig();
  return config.whatsappCliente;
}

/**
 * Obtiene si está habilitado el WhatsApp para vendedores
 */
export async function isWhatsappVendedorEnabled(): Promise<boolean> {
  const config = await getNotificacionesConfig();
  return config.whatsappVendedor;
}
