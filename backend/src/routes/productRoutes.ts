import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory
} from '../controllers/productController';
import { validate, validateParamsId, validateParamsSlug } from '../middleware/validation';
import { authenticateToken, authorize } from '../middleware/auth';
import { createProductSchema, updateProductSchema, paginationSchema, slugParamSchema } from '../schemas';

const router = Router();

// Public routes
router.get('/', validate(paginationSchema), getProducts);
router.get('/featured', validate(paginationSchema), getFeaturedProducts);
router.get('/category/:categorySlug', validate(slugParamSchema), getProductsByCategory);
router.get('/slug/:slug', validateParamsSlug, getProductBySlug);
router.get('/:id', validateParamsId, getProductById);

// Admin routes - Protected with authentication and authorization
router.post('/', 
  authenticateToken, 
  authorize('admin', 'staff'), 
  validate(createProductSchema), 
  createProduct
);
router.put('/:id', 
  authenticateToken, 
  authorize('admin', 'staff'), 
  validate(updateProductSchema), 
  updateProduct
);
router.delete('/:id', 
  authenticateToken, 
  authorize('admin'), 
  validateParamsId, 
  deleteProduct
);

export default router;