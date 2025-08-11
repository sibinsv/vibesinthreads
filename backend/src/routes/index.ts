import { Router } from 'express';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';

const router = Router();

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);

export default router;