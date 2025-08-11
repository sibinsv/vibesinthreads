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

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/main', getMainCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategoryById);

// Admin routes (authentication middleware to be added in future sprints)
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;