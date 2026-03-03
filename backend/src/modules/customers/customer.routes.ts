import { Router } from 'express';
import { customerController } from './customer.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/', customerController.getAll.bind(customerController));
router.get('/:id', customerController.getById.bind(customerController));
router.patch('/:id/status', customerController.updateStatus.bind(customerController));

export default router;
