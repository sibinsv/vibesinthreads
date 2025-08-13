import { Router } from 'express';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import authRoutes from './authRoutes';
import adminUserRoutes from './adminUserRoutes';

const router = Router();

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/admin/users', adminUserRoutes);

export default router;