import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { loginLimiter, refreshLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../../config/rateLimit';

const router = Router();

// Rate limiting en login (10 intentos / 15 min)
router.post('/login', loginLimiter, authController.login.bind(authController));

// Rate limiting en refresh token (30 intentos / 15 min)
router.post('/refresh', refreshLimiter, authController.refresh.bind(authController));

// Sin rate limit en logout (no es sensible a ataques)

// Rate limiting en forgot-password (3 solicitudes / hora)
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword.bind(authController));

// Rate limiting en reset-password (5 intentos / hora)
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword.bind(authController));

// Endpoints protegidos
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
