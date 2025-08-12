import { Router } from 'express';
import {
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getMainCategories
} from '../controllers/categoryController';
import { validate, validateParamsId, validateParamsSlug } from '../middleware/validation';
import { authenticateToken, authorize } from '../middleware/auth';
import { createCategorySchema, updateCategorySchema, slugParamSchema } from '../schemas';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/main', getMainCategories);
router.get('/slug/:slug', validate(slugParamSchema), getCategoryBySlug);
router.get('/:id', validateParamsId, getCategoryById);

// Admin routes - Protected with authentication and authorization
router.post('/', 
  authenticateToken, 
  authorize('admin', 'staff'), 
  validate(createCategorySchema), 
  createCategory
);
router.put('/:id', 
  authenticateToken, 
  authorize('admin', 'staff'), 
  validate(updateCategorySchema), 
  updateCategory
);
router.delete('/:id', 
  authenticateToken, 
  authorize('admin'), 
  validateParamsId, 
  deleteCategory
);

export default router;