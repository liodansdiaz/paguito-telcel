import { Router } from 'express';
import { adminChatConfigController } from './admin.chat-config.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate, requireRole('ADMIN'));

// CRUD de secciones del chat
// ⚠️ IMPORTANTE: Las rutas específicas DEBEN ir ANTES que las rutas con parámetros (:section)
router.get('/', adminChatConfigController.getAllSections.bind(adminChatConfigController));
router.get('/preview/system-prompt', adminChatConfigController.previewSystemPrompt.bind(adminChatConfigController)); // ← Específica ANTES
router.get('/:section', adminChatConfigController.getSectionByKey.bind(adminChatConfigController)); // ← Genérica DESPUÉS
router.post('/', adminChatConfigController.createSection.bind(adminChatConfigController));
router.put('/:section', adminChatConfigController.updateSection.bind(adminChatConfigController));
router.delete('/:section', adminChatConfigController.deleteSection.bind(adminChatConfigController));
router.patch('/:section/toggle', adminChatConfigController.toggleSection.bind(adminChatConfigController));

export default router;
