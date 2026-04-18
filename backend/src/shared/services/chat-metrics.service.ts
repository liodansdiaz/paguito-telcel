import { getRedisClient } from '../../config/redis';
import { logger } from '../utils/logger';

/**
 * ChatMetricsService
 * 
 * Servicio para monitorear y trackear el uso del chat:
 * - Requests por día/mes
 * - Tokens consumidos
 * - Costo estimado
 * - Usuarios únicos
 * 
 * Usa Redis para almacenar métricas en tiempo real.
 */
export class ChatMetricsService {
  // Precios de Groq (actualizado según su pricing)
  private static readonly COST_PER_MILLION_TOKENS = 0.05; // $0.05 por 1M tokens (input)
  private static readonly COST_PER_MILLION_TOKENS_OUTPUT = 0.10; // $0.10 por 1M tokens (output)

  // Límites configurables
  private static readonly MAX_COST_PER_DAY = 5.00; // $5/día máximo
  private static readonly MAX_COST_PER_MONTH = 50.00; // $50/mes máximo
  private static readonly ALERT_THRESHOLD = 0.8; // Alertar al 80% del límite

  /**
   * Genera la clave de Redis para una métrica específica
   */
  private static getKey(metric: string, date?: string): string {
    const today = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `chat:metrics:${metric}:${today}`;
  }

  /**
   * Registra un nuevo request al chat
   * 
   * @param fingerprint - ID único del usuario
   * @param tokensInput - Tokens del input (system prompt + historial + mensaje usuario)
   * @param tokensOutput - Tokens del output (respuesta del asistente)
   */
  static async trackRequest(fingerprint: string, tokensInput: number, tokensOutput: number): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7); // YYYY-MM

    try {
      // Incrementar contador de requests (día)
      await redis.incr(this.getKey('requests'));
      
      // Incrementar contador de requests (mes)
      await redis.incr(`chat:metrics:requests:${month}`);

      // Incrementar tokens consumidos (día)
      const totalTokens = tokensInput + tokensOutput;
      await redis.incrby(this.getKey('tokens'), totalTokens);
      await redis.incrby(this.getKey('tokens_input'), tokensInput);
      await redis.incrby(this.getKey('tokens_output'), tokensOutput);

      // Incrementar tokens consumidos (mes)
      await redis.incrby(`chat:metrics:tokens:${month}`, totalTokens);

      // Registrar usuario único (usando SET)
      await redis.sadd(this.getKey('users'), fingerprint);
      await redis.sadd(`chat:metrics:users:${month}`, fingerprint);

      // Calcular y almacenar costo (día)
      const costInput = (tokensInput / 1_000_000) * this.COST_PER_MILLION_TOKENS;
      const costOutput = (tokensOutput / 1_000_000) * this.COST_PER_MILLION_TOKENS_OUTPUT;
      const totalCost = costInput + costOutput;
      
      await redis.incrbyfloat(this.getKey('cost'), parseFloat(totalCost.toFixed(6)));
      await redis.incrbyfloat(`chat:metrics:cost:${month}`, parseFloat(totalCost.toFixed(6)));

      // Expirar keys después de 90 días
      await redis.expire(this.getKey('requests'), 90 * 24 * 60 * 60);
      await redis.expire(this.getKey('tokens'), 90 * 24 * 60 * 60);
      await redis.expire(this.getKey('users'), 90 * 24 * 60 * 60);
      await redis.expire(this.getKey('cost'), 90 * 24 * 60 * 60);

      // Verificar límites
      await this.checkLimits();

      logger.debug('Chat metrics tracked', {
        fingerprint,
        tokensInput,
        tokensOutput,
        cost: totalCost.toFixed(4),
      });
    } catch (error) {
      logger.error('Error tracking chat metrics', { error });
    }
  }

  /**
   * Obtiene las métricas del día actual
   */
  static async getTodayMetrics(): Promise<{
    requests: number;
    tokens: number;
    tokensInput: number;
    tokensOutput: number;
    uniqueUsers: number;
    cost: number;
  }> {
    const redis = getRedisClient();
    if (!redis) {
      return { requests: 0, tokens: 0, tokensInput: 0, tokensOutput: 0, uniqueUsers: 0, cost: 0 };
    }

    try {
      const [requests, tokens, tokensInput, tokensOutput, users, cost] = await Promise.all([
        redis.get(this.getKey('requests')),
        redis.get(this.getKey('tokens')),
        redis.get(this.getKey('tokens_input')),
        redis.get(this.getKey('tokens_output')),
        redis.scard(this.getKey('users')),
        redis.get(this.getKey('cost')),
      ]);

      return {
        requests: parseInt(requests || '0'),
        tokens: parseInt(tokens || '0'),
        tokensInput: parseInt(tokensInput || '0'),
        tokensOutput: parseInt(tokensOutput || '0'),
        uniqueUsers: users || 0,
        cost: parseFloat(cost || '0'),
      };
    } catch (error) {
      logger.error('Error getting today metrics', { error });
      return { requests: 0, tokens: 0, tokensInput: 0, tokensOutput: 0, uniqueUsers: 0, cost: 0 };
    }
  }

  /**
   * Obtiene las métricas del mes actual
   */
  static async getMonthMetrics(): Promise<{
    requests: number;
    tokens: number;
    uniqueUsers: number;
    cost: number;
  }> {
    const redis = getRedisClient();
    if (!redis) {
      return { requests: 0, tokens: 0, uniqueUsers: 0, cost: 0 };
    }

    const month = new Date().toISOString().substring(0, 7);

    try {
      const [requests, tokens, users, cost] = await Promise.all([
        redis.get(`chat:metrics:requests:${month}`),
        redis.get(`chat:metrics:tokens:${month}`),
        redis.scard(`chat:metrics:users:${month}`),
        redis.get(`chat:metrics:cost:${month}`),
      ]);

      return {
        requests: parseInt(requests || '0'),
        tokens: parseInt(tokens || '0'),
        uniqueUsers: users || 0,
        cost: parseFloat(cost || '0'),
      };
    } catch (error) {
      logger.error('Error getting month metrics', { error });
      return { requests: 0, tokens: 0, uniqueUsers: 0, cost: 0 };
    }
  }

  /**
   * Verifica si se excedieron los límites configurados
   * Si se excede el límite, registra una alerta
   */
  private static async checkLimits(): Promise<void> {
    const todayMetrics = await this.getTodayMetrics();
    const monthMetrics = await this.getMonthMetrics();

    // Verificar límite diario
    if (todayMetrics.cost >= this.MAX_COST_PER_DAY) {
      logger.error('🚨 LÍMITE DIARIO DE CHAT EXCEDIDO', {
        cost: todayMetrics.cost,
        limit: this.MAX_COST_PER_DAY,
      });
      // Aquí podrías enviar email, deshabilitar el chat, etc.
    } else if (todayMetrics.cost >= this.MAX_COST_PER_DAY * this.ALERT_THRESHOLD) {
      logger.warn('⚠️ Advertencia: Cerca del límite diario de chat', {
        cost: todayMetrics.cost,
        limit: this.MAX_COST_PER_DAY,
        percentage: ((todayMetrics.cost / this.MAX_COST_PER_DAY) * 100).toFixed(1),
      });
    }

    // Verificar límite mensual
    if (monthMetrics.cost >= this.MAX_COST_PER_MONTH) {
      logger.error('🚨 LÍMITE MENSUAL DE CHAT EXCEDIDO', {
        cost: monthMetrics.cost,
        limit: this.MAX_COST_PER_MONTH,
      });
    } else if (monthMetrics.cost >= this.MAX_COST_PER_MONTH * this.ALERT_THRESHOLD) {
      logger.warn('⚠️ Advertencia: Cerca del límite mensual de chat', {
        cost: monthMetrics.cost,
        limit: this.MAX_COST_PER_MONTH,
        percentage: ((monthMetrics.cost / this.MAX_COST_PER_MONTH) * 100).toFixed(1),
      });
    }
  }

  /**
   * Verifica si el chat debe estar habilitado según los límites
   */
  static async isChatEnabled(): Promise<boolean> {
    const todayMetrics = await this.getTodayMetrics();
    const monthMetrics = await this.getMonthMetrics();

    // Si se excedió el límite diario o mensual, deshabilitar
    if (todayMetrics.cost >= this.MAX_COST_PER_DAY) {
      return false;
    }

    if (monthMetrics.cost >= this.MAX_COST_PER_MONTH) {
      return false;
    }

    return true;
  }

  /**
   * Obtiene los límites configurados
   */
  static getLimits() {
    return {
      maxCostPerDay: this.MAX_COST_PER_DAY,
      maxCostPerMonth: this.MAX_COST_PER_MONTH,
      alertThreshold: this.ALERT_THRESHOLD,
    };
  }
}

export const chatMetricsService = ChatMetricsService;
