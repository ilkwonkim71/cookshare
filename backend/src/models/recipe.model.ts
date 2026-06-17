import { query } from '../db';

export interface RecipeRow {
  id: number;
  title: string;
  description: string | null;
  ingredients: string;
  steps: string;
  image_url: string | null;
  cook_time: number | null;
  servings: number | null;
  author_id: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeWithAuthor extends RecipeRow {
  author_name: string;
  author_email: string;
}

export interface RecipeDTO {
  id: number;
  title: string;
  description: string | null;
  ingredients: string[];
  steps: string[];
  imageUrl: string | null;
  cookTime: number | null;
  servings: number | null;
  author: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function toRecipeDTO(row: RecipeWithAuthor): RecipeDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ingredients: parseJson<string[]>(row.ingredients, []),
    steps: parseJson<string[]>(row.steps, []),
    imageUrl: row.image_url,
    cookTime: row.cook_time,
    servings: row.servings,
    author: { id: row.author_id, name: row.author_name },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_WITH_AUTHOR = `
  SELECT r.*, u.name AS author_name, u.email AS author_email
  FROM recipes r
  JOIN users u ON u.id = r.author_id
`;

export const RecipeModel = {
  async findAll(opts: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rows: RecipeWithAuthor[]; total: number }> {
    const limit = opts.limit ?? 20;
    const offset = ((opts.page ?? 1) - 1) * limit;

    if (opts.q) {
      const pattern = `%${opts.q}%`;
      const rowsRes = await query<RecipeWithAuthor>(
        `${SELECT_WITH_AUTHOR} WHERE r.title ILIKE $1 OR r.description ILIKE $2 ORDER BY r.created_at DESC LIMIT $3 OFFSET $4`,
        [pattern, pattern, limit, offset],
      );
      const countRes = await query<{ total: string }>(
        'SELECT COUNT(*) AS total FROM recipes WHERE title ILIKE $1 OR description ILIKE $2',
        [pattern, pattern],
      );
      return { rows: rowsRes.rows, total: Number(countRes.rows[0].total) };
    }

    const rowsRes = await query<RecipeWithAuthor>(
      `${SELECT_WITH_AUTHOR} ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const countRes = await query<{ total: string }>('SELECT COUNT(*) AS total FROM recipes');
    return { rows: rowsRes.rows, total: Number(countRes.rows[0].total) };
  },

  async findById(id: number): Promise<RecipeWithAuthor | undefined> {
    const res = await query<RecipeWithAuthor>(`${SELECT_WITH_AUTHOR} WHERE r.id = $1`, [id]);
    return res.rows[0];
  },

  async create(data: {
    title: string;
    description?: string;
    ingredients: string[];
    steps: string[];
    image_url?: string;
    cook_time?: number;
    servings?: number;
    author_id: number;
  }): Promise<RecipeWithAuthor> {
    const now = new Date().toISOString();
    const res = await query<{ id: number }>(
      `INSERT INTO recipes (title, description, ingredients, steps, image_url, cook_time, servings, author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        data.title,
        data.description ?? null,
        JSON.stringify(data.ingredients),
        JSON.stringify(data.steps),
        data.image_url ?? null,
        data.cook_time ?? null,
        data.servings ?? null,
        data.author_id,
        now,
        now,
      ],
    );
    return (await this.findById(res.rows[0].id))!;
  },

  async update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      ingredients: string[];
      steps: string[];
      image_url: string;
      cook_time: number;
      servings: number;
    }>,
  ): Promise<RecipeWithAuthor | undefined> {
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = $1'];
    const values: unknown[] = [now];
    let i = 2;

    if (data.title !== undefined) {
      sets.push(`title = $${i++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${i++}`);
      values.push(data.description);
    }
    if (data.ingredients !== undefined) {
      sets.push(`ingredients = $${i++}`);
      values.push(JSON.stringify(data.ingredients));
    }
    if (data.steps !== undefined) {
      sets.push(`steps = $${i++}`);
      values.push(JSON.stringify(data.steps));
    }
    if (data.image_url !== undefined) {
      sets.push(`image_url = $${i++}`);
      values.push(data.image_url);
    }
    if (data.cook_time !== undefined) {
      sets.push(`cook_time = $${i++}`);
      values.push(data.cook_time);
    }
    if (data.servings !== undefined) {
      sets.push(`servings = $${i++}`);
      values.push(data.servings);
    }

    values.push(id);
    await query(`UPDATE recipes SET ${sets.join(', ')} WHERE id = $${i}`, values);
    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await query('DELETE FROM recipes WHERE id = $1', [id]);
  },
};
