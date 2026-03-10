import { Router } from 'express';
import { handleChat } from './chat.controller';
import { chatLimiter } from '../../config/rateLimit';

const router = Router();

// Ruta pública — rate limit configurado en rateLimit.ts
router.post('/', chatLimiter, handleChat);

export default router;
