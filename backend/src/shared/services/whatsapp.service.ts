import { logger } from '../utils/logger';

interface WhatsAppOptions {
  numero: string;
  mensaje: string;
}

interface EvolutionApiResponse {
  key?: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: Record<string, unknown>;
  status?: string;
}

interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

class WhatsAppService {
  /**
   * Lee la configuración de Evolution API desde las variables de entorno.
   * Se lee en cada llamada para soportar cambios de configuración en runtime
   * y para facilitar los tests (las env vars se configuran después de la importación).
   */
  private getConfig(): EvolutionConfig {
    return {
      apiUrl: process.env.EVOLUTION_API_URL || '',
      apiKey: process.env.EVOLUTION_API_KEY || '',
      instanceName: process.env.EVOLUTION_INSTANCE_NAME || '',
    };
  }

  /**
   * Envía un mensaje de texto por WhatsApp via Evolution API
   * @param options - Número (formato: 521XXXXXXXXXX) y mensaje a enviar
   * @throws Error si la API responde con error o la configuración es inválida
   */
  async send(options: WhatsAppOptions): Promise<EvolutionApiResponse> {
    const config = this.getConfig();
    this.validateConfig(config);

    const numeroLimpio = this.normalizarNumero(options.numero);
    const url = `${config.apiUrl}/message/sendText/${config.instanceName}`;

    const body = {
      number: numeroLimpio,
      textMessage: {
        text: options.mensaje,
      },
    };

    logger.info(`Enviando WhatsApp a ${numeroLimpio} via Evolution API`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000), // 10 segundos máximo
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Evolution API respondió con status ${response.status}: ${errorText}`);
      throw new Error(`Error al enviar WhatsApp: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as EvolutionApiResponse;
    logger.info(`WhatsApp enviado exitosamente a ${numeroLimpio}`, { messageId: data.key?.id });

    return data;
  }

  /**
   * Normaliza un número de teléfono mexicano al formato que espera Evolution API
   * - Elimina espacios, guiones, paréntesis
   * - Si empieza con +52, lo convierte a 521
   * - Si empieza con 52 (sin 1), agrega el 1
   * - Si es un número de 10 dígitos, le agrega 521
   */
  private normalizarNumero(numero: string): string {
    let limpio = numero.replace(/[\s\-\(\)]/g, '');

    // Si empieza con +52, quitar el + y asegurar que tenga el 1
    if (limpio.startsWith('+52')) {
      limpio = limpio.substring(1); // Quitar el +
      if (!limpio.startsWith('521')) {
        limpio = '521' + limpio.substring(2); // Reemplazar 52 por 521
      }
      return limpio;
    }

    // Si ya empieza con 521, dejarlo así
    if (limpio.startsWith('521')) {
      return limpio;
    }

    // Si empieza con 52 pero no tiene el 1, agregarlo
    if (limpio.startsWith('52')) {
      return '521' + limpio.substring(2);
    }

    // Si es un número de 10 dígitos (número local), agregar 521
    if (limpio.length === 10) {
      return '521' + limpio;
    }

    // Si empieza con 1 y tiene 11 dígitos, agregar 52
    if (limpio.startsWith('1') && limpio.length === 11) {
      return '52' + limpio;
    }

    // Devolver tal cual si no coincide con ningún patrón
    logger.warn(`Formato de número no reconocido: ${numero}, usando tal cual: ${limpio}`);
    return limpio;
  }

  /**
   * Valida que la configuración de Evolution API esté completa
   */
  private validateConfig(config: EvolutionConfig): void {
    if (!config.apiUrl) {
      throw new Error('EVOLUTION_API_URL no está configurada en las variables de entorno');
    }
    if (!config.apiKey) {
      throw new Error('EVOLUTION_API_KEY no está configurada en las variables de entorno');
    }
    if (!config.instanceName) {
      throw new Error('EVOLUTION_INSTANCE_NAME no está configurada en las variables de entorno');
    }
  }

  /**
   * Verifica la conexión con Evolution API
   * @returns true si la instancia está conectada y funcionando
   */
  async verify(): Promise<boolean> {
    try {
      const config = this.getConfig();
      this.validateConfig(config);

      const url = `${config.apiUrl}/instance/connectionState/${config.instanceName}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': config.apiKey,
        },
        signal: AbortSignal.timeout(5000), // 5 segundos máximo
      });

      if (!response.ok) {
        logger.error(`Evolution API no responde: ${response.status}`);
        return false;
      }

      const data = await response.json() as { instance?: { state?: string } };
      const isConnected = data.instance?.state === 'open';

      if (!isConnected) {
        logger.warn(`Instancia WhatsApp no conectada. Estado: ${data.instance?.state || 'desconocido'}`);
      }

      return isConnected;
    } catch (err) {
      logger.error('Error verificando conexión con Evolution API:', err);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
