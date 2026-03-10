import { Router } from 'express';
import { handleChat } from './chat.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit: máximo 30 mensajes por IP cada 10 minutos
// Protege el tier gratuito de Groq de abusos
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 30,
  message: { error: 'Demasiados mensajes. Por favor espera unos minutos antes de continuar.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ruta pública — no requiere autenticación
router.post('/', chatLimiter, handleChat);

export default router;
