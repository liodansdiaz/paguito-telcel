import { prisma } from '../../config/database';
import { CacheService } from './cache.service';
import { logger } from '../utils/logger';

/**
 * ChatConfigService
 * 
 * Servicio para gestionar la configuración del asistente virtual (chat).
 * 
 * RESPONSABILIDADES:
 * - Construir el SYSTEM_PROMPT dinámicamente desde la base de datos
 * - Cachear el prompt para evitar consultas repetitivas
 * - Invalidar cache al editar configuración
 * - CRUD de secciones del prompt
 */
export class ChatConfigService {
  private static readonly CACHE_KEY = 'chat:systemPrompt';
  private static readonly CACHE_TTL = 300; // 5 minutos

  /**
   * Construye el SYSTEM_PROMPT completo juntando todas las secciones activas
   * de la base de datos, ordenadas por el campo 'order'.
   * 
   * El resultado se cachea en Redis por 5 minutos.
   * 
   * @returns El SYSTEM_PROMPT completo listo para enviar a Groq
   */
  static async buildSystemPrompt(): Promise<string> {
    return CacheService.getOrSet<string>(
      this.CACHE_KEY,
      async () => {
        const sections = await prisma.chatPromptSection.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        });

        if (sections.length === 0) {
          logger.warn('No hay secciones de chat configuradas en la DB. Usando prompt por defecto.');
          return this.getDefaultPrompt();
        }

        // Construir el prompt juntando todas las secciones
        const prompt = sections
          .map((s) => {
            const separator = '═'.repeat(31);
            return `${separator}\n ${s.title}\n${separator}\n${s.content.trim()}`;
          })
          .join('\n\n');

        logger.debug('SYSTEM_PROMPT construido desde DB', { sectionsCount: sections.length });
        return prompt.trim();
      },
      { ttl: this.CACHE_TTL }
    );
  }

  /**
   * Invalida el cache del SYSTEM_PROMPT.
   * Llamar a este método cuando se edite alguna sección.
   */
  static async invalidateCache(): Promise<void> {
    await CacheService.delete(this.CACHE_KEY);
    logger.info('🗑️ Cache del SYSTEM_PROMPT invalidado');
  }

  /**
   * Obtiene todas las secciones (activas e inactivas)
   */
  static async getAllSections() {
    return prisma.chatPromptSection.findMany({
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Obtiene una sección específica por su identificador
   */
  static async getSectionByKey(section: string) {
    return prisma.chatPromptSection.findUnique({
      where: { section },
    });
  }

  /**
   * Crea una nueva sección
   */
  static async createSection(data: {
    section: string;
    title: string;
    content: string;
    order: number;
    isActive?: boolean;
  }) {
    const newSection = await prisma.chatPromptSection.create({
      data,
    });
    await this.invalidateCache();
    logger.info('✅ Nueva sección de chat creada', { section: data.section });
    return newSection;
  }

  /**
   * Actualiza una sección existente
   */
  static async updateSection(
    section: string,
    data: {
      title?: string;
      content?: string;
      order?: number;
      isActive?: boolean;
    }
  ) {
    const updated = await prisma.chatPromptSection.update({
      where: { section },
      data,
    });
    await this.invalidateCache();
    logger.info('✅ Sección de chat actualizada', { section });
    return updated;
  }

  /**
   * Elimina una sección
   */
  static async deleteSection(section: string) {
    await prisma.chatPromptSection.delete({
      where: { section },
    });
    await this.invalidateCache();
    logger.info('🗑️ Sección de chat eliminada', { section });
  }

  /**
   * Activa o desactiva una sección sin eliminarla
   */
  static async toggleSection(section: string, isActive: boolean) {
    const updated = await prisma.chatPromptSection.update({
      where: { section },
      data: { isActive },
    });
    await this.invalidateCache();
    logger.info(`✅ Sección de chat ${isActive ? 'activada' : 'desactivada'}`, { section });
    return updated;
  }

  /**
   * Prompt por defecto (fallback si no hay secciones en DB)
   * Este es el mismo que estaba hardcodeado antes.
   */
  private static getDefaultPrompt(): string {
    return `
Eres el asistente virtual de Amigos Paguito Telcel, una tienda de celulares con crédito a domicilio.

═══════════════════════════════
 INFORMACIÓN GENERAL
═══════════════════════════════
- Negocio: Amigos Paguito Telcel
- Ubicación: Tapachula, Chiapas — también atendemos pueblos y comunidades cercanas
- Horario de atención:
    • Lunes a Viernes: 9:30 a.m. – 4:30 p.m.
    • Sábados: 9:30 a.m. – 2:30 p.m.
    • Domingos: cerrado

═══════════════════════════════
 CRÉDITO — CÓMO FUNCIONA
═══════════════════════════════
- Vendemos celulares a crédito sin necesidad de que el cliente vaya a ninguna tienda.
- Nuestro vendedor va hasta la puerta de tu casa para realizar todo el trámite.
- Requisito único: presentar INE (credencial de elector) vigente.
- Plazos disponibles: 13 semanas, 26 semanas o 39 semanas.
- El enganche varía según el equipo que el cliente elija (consultar con el vendedor).
- No se necesita buró de crédito ni historial bancario.

═══════════════════════════════
 GARANTÍA
═══════════════════════════════
- Todos los equipos cuentan con 1 año de garantía oficial con Telcel.

═══════════════════════════════
 FORMAS DE PAGO (pagos semanales)
═══════════════════════════════
- Oxxo
- Bodega Aurrerá
- Transferencia electrónica vía Mercado Pago

═══════════════════════════════
 INSTRUCCIONES PARA EL ASISTENTE
═══════════════════════════════
- Responde siempre en español, de forma amable, clara y concisa.
- Si el cliente pregunta por un equipo, menciona precio de contado, pago semanal estimado y disponibilidad de stock.
- Si el cliente pregunta por crédito, explica el proceso: el vendedor va a domicilio, solo se necesita INE, plazos de 13, 26 o 39 semanas.
- Si no sabes algo o el cliente necesita atención personalizada, invítalo a comunicarse durante el horario de atención.
- No inventes precios, disponibilidad ni información que no esté en este prompt o en el catálogo proporcionado.
- Nunca menciones a competidores ni hagas comparaciones con otras tiendas.
- Sé proactivo: si el cliente muestra interés en un equipo, ofrécele información sobre crédito aunque no lo haya pedido.
    `.trim();
  }
}

export const chatConfigService = ChatConfigService;
