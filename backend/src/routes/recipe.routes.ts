import { Router } from 'express';
import {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../controllers/recipe.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', listRecipes);
router.get('/:id', getRecipe);
router.post('/', requireAuth, createRecipe);
router.put('/:id', requireAuth, updateRecipe);
router.delete('/:id', requireAuth, deleteRecipe);

export default router;
