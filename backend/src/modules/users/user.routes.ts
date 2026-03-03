import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/', userController.getAll.bind(userController));
router.get('/:id', userController.getById.bind(userController));
router.post('/', userController.create.bind(userController));
router.put('/:id', userController.update.bind(userController));
router.patch('/:id/toggle', userController.toggleActive.bind(userController));

export default router;
