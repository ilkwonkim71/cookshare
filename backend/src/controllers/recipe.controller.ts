import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RecipeModel, toRecipeDTO } from '../models/recipe.model';
import { AppError } from '../middleware/error';

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  ingredients: z.array(z.string()).min(1, 'At least one ingredient required'),
  steps: z.array(z.string()).min(1, 'At least one step required'),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  cookTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
});

const updateRecipeSchema = recipeSchema.partial();

export function listRecipes(req: Request, res: Response, next: NextFunction): void {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

    const { rows, total } = RecipeModel.findAll({ q, page });
    const recipes = rows.map(toRecipeDTO);

    res.json({ recipes, total });
  } catch (err) {
    next(err);
  }
}

export function getRecipe(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new AppError('Invalid recipe ID', 400, 'INVALID_ID');
    }

    const row = RecipeModel.findById(id);
    if (!row) {
      throw new AppError('Recipe not found', 404, 'NOT_FOUND');
    }

    res.json({ recipe: toRecipeDTO(row) });
  } catch (err) {
    next(err);
  }
}

export function createRecipe(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const parsed = recipeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors[0]?.message ?? 'Validation error',
        400,
        'VALIDATION_ERROR',
      );
    }

    const { title, description, ingredients, steps, imageUrl, cookTime, servings } = parsed.data;

    const row = RecipeModel.create({
      title,
      description,
      ingredients,
      steps,
      image_url: imageUrl,
      cook_time: cookTime,
      servings,
      author_id: req.user.id,
    });

    res.status(201).json({ recipe: toRecipeDTO(row) });
  } catch (err) {
    next(err);
  }
}

export function updateRecipe(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new AppError('Invalid recipe ID', 400, 'INVALID_ID');
    }

    const existing = RecipeModel.findById(id);
    if (!existing) {
      throw new AppError('Recipe not found', 404, 'NOT_FOUND');
    }

    if (existing.author_id !== req.user.id) {
      throw new AppError('Forbidden: you are not the author of this recipe', 403, 'FORBIDDEN');
    }

    const parsed = updateRecipeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors[0]?.message ?? 'Validation error',
        400,
        'VALIDATION_ERROR',
      );
    }

    const { title, description, ingredients, steps, imageUrl, cookTime, servings } = parsed.data;

    const updated = RecipeModel.update(id, {
      title,
      description,
      ingredients,
      steps,
      image_url: imageUrl,
      cook_time: cookTime,
      servings,
    });

    res.json({ recipe: toRecipeDTO(updated!) });
  } catch (err) {
    next(err);
  }
}

export function deleteRecipe(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new AppError('Invalid recipe ID', 400, 'INVALID_ID');
    }

    const existing = RecipeModel.findById(id);
    if (!existing) {
      throw new AppError('Recipe not found', 404, 'NOT_FOUND');
    }

    if (existing.author_id !== req.user.id) {
      throw new AppError('Forbidden: you are not the author of this recipe', 403, 'FORBIDDEN');
    }

    RecipeModel.delete(id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
