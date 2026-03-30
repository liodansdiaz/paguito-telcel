import { Request, Response, NextFunction } from 'express';
import Groq from 'groq-sdk';
import { prisma } from '../../config/database';
import { CacheService } from '../../shared/services/cache.service';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Aquí defines todo lo que el asistente sabe del negocio.
//
// CÓMO MODIFICARLO EN EL FUTURO:
//   1. Abre este archivo: backend/src/modules/chat/chat.controller.ts
//   2. Edita el texto dentro de la constante SYSTEM_PROMPT que está abajo.
//   3. Guarda el archivo — el servidor se reinicia automáticamente (ts-node-dev).
//
// SECCIONES QUE PUEDES EDITAR:
//   - "INFORMACIÓN GENERAL"  → nombre, ciudad, horarios, zona de servicio
//   - "CRÉDITO"              → requisitos, plazos, enganche, proceso de venta
//   - "GARANTÍA"             → duración y condiciones
//   - "FORMAS DE PAGO"       → dónde y cómo pagar
//   - "INSTRUCCIONES"        → cómo debe comportarse el asistente
//
// El catálogo de productos (precios, stock) se inserta automáticamente
// desde la base de datos — no necesitas editarlo manualmente aquí.
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
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

// ─────────────────────────────────────────────────────────────────────────────

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('El servicio de chat no está configurado. Falta GROQ_API_KEY.');
    }
    groq = new Groq({ apiKey });
  }
  return groq;
}

// Formato de un mensaje del historial
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Consulta todos los productos activos (incluyendo sin stock) para inyectarlos al prompt
// Se permiten reservas de productos sin stock — el negocio puede conseguirlos
async function getProductContext(): Promise<string> {
  return CacheService.getOrSet<string>(
    'chat:productContext',
    async () => {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          nombre: true,
          marca: true,
          precio: true,
          precioAnterior: true,
          pagosSemanales: true,
          stock: true,
          badge: true,
          disponibleCredito: true,
          descripcion: true,
        },
        orderBy: { nombre: 'asc' },
      });

      if (products.length === 0) {
        return 'CATÁLOGO: No hay productos dados de alta en el sistema.';
      }

      const lines = products.map((p) => {
        const precio = `$${Number(p.precio).toLocaleString('es-MX')}`;
        const precioAnterior = p.precioAnterior
          ? ` (antes ${`$${Number(p.precioAnterior).toLocaleString('es-MX')}`})`
          : '';
        const stockInfo = p.stock === 0 ? ' (SIN STOCK - se puede reservar)' : ` (${p.stock} unidades)`;
        const credito = p.disponibleCredito && p.pagosSemanales
          ? ` | Pago semanal: $${Number(p.pagosSemanales).toLocaleString('es-MX')}`
          : p.disponibleCredito
          ? ' | Disponible a crédito'
          : ' | Solo contado';
        const badge = p.badge ? ` [${p.badge}]` : '';
        const desc = p.descripcion ? ` — ${p.descripcion}` : '';

        return `• ${p.marca} ${p.nombre}${badge} | Precio contado: ${precio}${precioAnterior}${credito}${stockInfo}${desc}`;
      });

      return `CATÁLOGO DE PRODUCTOS DISPONIBLES (actualizado en tiempo real):\n${lines.join('\n')}`;
    },
    { ttl: 300, prefix: 'chat' } // Cache 5 minutos
  );
}

export async function handleChat(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: ChatMessage[];
    };

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
      return;
    }

    if (message.trim().length > 500) {
      res.status(400).json({ error: 'El mensaje es demasiado largo.' });
      return;
    }

    // Obtener catálogo actualizado desde la DB
    const productContext = await getProductContext();

    // Construir el system prompt completo: info fija + catálogo dinámico
    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${'═'.repeat(31)}\n${productContext}\n${'═'.repeat(31)}`;

    // Limitar historial a los últimos 10 mensajes para no exceder tokens
    const recentHistory = history.slice(-10);

    // Configurar headers para SSE (Server-Sent Events — streaming)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Llamar a Groq con streaming
    const client = getGroqClient();
    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: fullSystemPrompt },
        ...recentHistory,
        { role: 'user', content: message.trim() },
      ],
      stream: true,
      temperature: 0.6,
      max_tokens: 600,
    });

    // Enviar cada fragmento al cliente en tiempo real
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
      }
    }

    // Señal de fin del stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[CHAT ERROR]', err?.message || err);
    // Si ya se empezó a enviar el stream, cerrarlo con error
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err?.message || 'Error al procesar la respuesta.' })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}
