import { Router } from 'express';
import { handleChat } from './chat.controller';
import { chatLimiter } from '../../config/rateLimit';
import { chatRateLimitMiddleware } from '../../shared/middleware/chat-rate-limit.middleware';

const router = Router();

// Ruta pública
// 1. chatLimiter: Rate limit por IP (fallback básico)
// 2. chatRateLimitMiddleware: Rate limit por sesión (más robusto)
router.post('/', chatLimiter, chatRateLimitMiddleware, handleChat);

export default router;
