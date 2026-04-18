import { Request, Response, NextFunction } from 'express';
import Groq from 'groq-sdk';
import { prisma } from '../../config/database';
import { CacheService } from '../../shared/services/cache.service';
import { chatConfigService } from '../../shared/services/chat-config.service';
import { chatMetricsService } from '../../shared/services/chat-metrics.service';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — AHORA SE CARGA DINÁMICAMENTE DESDE LA BASE DE DATOS
//
// CÓMO MODIFICARLO:
//   1. Ve al panel de administración → Configuración del Chat
//   2. Edita las secciones directamente desde el navegador
//   3. Los cambios se aplican inmediatamente (el cache se invalida automáticamente)
//
// NO NECESITAS TOCAR CÓDIGO NUNCA MÁS PARA CAMBIAR EL PROMPT.
//
// El servicio chatConfigService.buildSystemPrompt() se encarga de:
//   - Leer todas las secciones activas de la tabla 'chat_prompt_sections'
//   - Ordenarlas por el campo 'order'
//   - Juntarlas en un solo prompt
//   - Cachear el resultado en Redis por 5 minutos
// ─────────────────────────────────────────────────────────────────────────────

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
  // Variables para trackear tokens consumidos
  let tokensInput = 0;
  let tokensOutput = 0;
  
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: ChatMessage[];
    };

    // Obtener fingerprint del header
    const fingerprint = (req.headers['x-session-id'] as string) || 'anonymous';

    // Validación 1: Mensaje vacío
    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ 
        error: 'El mensaje no puede estar vacío.',
        errorType: 'VALIDATION_ERROR',
        errorCode: 'EMPTY_MESSAGE'
      });
      return;
    }

    // Validación 2: Mensaje muy largo
    const maxLength = 500;
    if (message.trim().length > maxLength) {
      res.status(400).json({ 
        error: `Tu mensaje es demasiado largo (${message.trim().length} caracteres). El máximo permitido es ${maxLength}.`,
        errorType: 'VALIDATION_ERROR',
        errorCode: 'MESSAGE_TOO_LONG',
        maxLength,
        currentLength: message.trim().length
      });
      return;
    }

    // Obtener SYSTEM_PROMPT dinámico desde la DB (cacheado 5 minutos)
    const systemPrompt = await chatConfigService.buildSystemPrompt();

    // Obtener catálogo actualizado desde la DB (cacheado 5 minutos)
    const productContext = await getProductContext();

    // Construir el prompt completo: configuración + catálogo dinámico
    const fullSystemPrompt = `${systemPrompt}\n\n${'═'.repeat(31)}\n${productContext}\n${'═'.repeat(31)}`;

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
      temperature: 0.8,  // 👈 Más alto = más creativo y natural (antes 0.6)
      max_tokens: 250,   // 👈 Menos tokens = respuestas más cortas (antes 600)
      top_p: 0.9,        // 👈 Control de diversidad en la generación
    });

    // Estimar tokens del input (aproximación)
    // fullSystemPrompt + historial + mensaje usuario
    const estimatedSystemTokens = Math.ceil(fullSystemPrompt.length / 4); // ~4 chars por token
    const estimatedHistoryTokens = Math.ceil(JSON.stringify(recentHistory).length / 4);
    const estimatedMessageTokens = Math.ceil(message.trim().length / 4);
    tokensInput = estimatedSystemTokens + estimatedHistoryTokens + estimatedMessageTokens;

    // Enviar cada fragmento al cliente en tiempo real
    let outputText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        outputText += delta;
        res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
      }
    }

    // Estimar tokens del output
    tokensOutput = Math.ceil(outputText.length / 4);

    // Trackear métricas
    await chatMetricsService.trackRequest(fingerprint, tokensInput, tokensOutput);

    // Señal de fin del stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[CHAT ERROR]', err?.message || err);
    
    // Detectar el tipo de error y dar mensajes específicos
    let errorMessage = 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
    let errorType = 'UNKNOWN_ERROR';
    let errorCode = 'GENERIC_ERROR';

    // Error de Groq API (timeout, rate limit, etc.)
    if (err?.error?.type === 'server_error' || err?.error?.code === 'rate_limit_exceeded') {
      errorMessage = 'El asistente está experimentando alta demanda. Por favor intenta de nuevo en unos segundos.';
      errorType = 'GROQ_ERROR';
      errorCode = 'RATE_LIMIT';
    } else if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND') {
      errorMessage = 'No pudimos conectar con el servicio de IA. Por favor intenta más tarde.';
      errorType = 'NETWORK_ERROR';
      errorCode = 'CONNECTION_FAILED';
    } else if (err?.error?.code === 'context_length_exceeded') {
      errorMessage = 'La conversación es muy larga. Por favor limpia el historial y vuelve a intentar.';
      errorType = 'GROQ_ERROR';
      errorCode = 'CONTEXT_TOO_LONG';
    } else if (err?.response?.status === 401) {
      errorMessage = 'Error de autenticación con el servicio de IA. Por favor contacta al administrador.';
      errorType = 'AUTH_ERROR';
      errorCode = 'INVALID_API_KEY';
    }

    // Si ya se empezó a enviar el stream, cerrarlo con error
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ 
        error: errorMessage,
        errorType,
        errorCode
      })}\n\n`);
      res.end();
    } else {
      // Si no se envió nada, enviar JSON normal
      res.status(500).json({ 
        error: errorMessage,
        errorType,
        errorCode
      });
    }
  }
}
