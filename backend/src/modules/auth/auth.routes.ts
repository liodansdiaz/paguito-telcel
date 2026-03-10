import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { loginLimiter, refreshLimiter } from '../../config/rateLimit';

const router = Router();

router.post('/login', loginLimiter, authController.login.bind(authController));
router.post('/refresh', refreshLimiter, authController.refresh.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
