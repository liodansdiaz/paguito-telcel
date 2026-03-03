import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

// Rutas públicas
router.get('/', productController.getPublicProducts.bind(productController));
router.get('/marcas', productController.getMarcas.bind(productController));
router.get('/home/populares', productController.getPopulares.bind(productController));
router.get('/home/ofertas', productController.getEnOferta.bind(productController));
router.get('/:id', productController.getPublicProductById.bind(productController));

// Rutas admin
router.get('/admin/list', authenticate, requireRole('ADMIN'), productController.getAdminProducts.bind(productController));

router.post(
  '/admin',
  authenticate,
  requireRole('ADMIN'),
  productController.uploadMiddleware.bind(productController),
  productController.createProduct.bind(productController)
);

router.put(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN'),
  productController.uploadMiddleware.bind(productController),
  productController.updateProduct.bind(productController)
);

router.patch('/admin/:id/toggle', authenticate, requireRole('ADMIN'), productController.toggleStatus.bind(productController));
router.delete('/admin/:id', authenticate, requireRole('ADMIN'), productController.deleteProduct.bind(productController));

export default router;
