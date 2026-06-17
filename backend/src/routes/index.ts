import { Router } from 'express';
import authRoutes from './auth.routes';
import recipeRoutes from './recipe.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/recipes', recipeRoutes);
router.use('/uploads', uploadRoutes);

export default router;
