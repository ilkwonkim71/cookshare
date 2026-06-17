import { getDb } from '../db';

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
  author: {
    id: number;
    name: string;
  };
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
    author: {
      id: row.author_id,
      name: row.author_name,
    },
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
  findAll(opts: { q?: string; page?: number; limit?: number }): {
    rows: RecipeWithAuthor[];
    total: number;
  } {
    const db = getDb();
    const limit = opts.limit ?? 20;
    const offset = ((opts.page ?? 1) - 1) * limit;

    if (opts.q) {
      const pattern = `%${opts.q}%`;
      const rows = db
        .prepare(
          `${SELECT_WITH_AUTHOR} WHERE r.title LIKE ? OR r.description LIKE ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
        )
        .all(pattern, pattern, limit, offset) as RecipeWithAuthor[];
      const { total } = db
        .prepare('SELECT COUNT(*) AS total FROM recipes WHERE title LIKE ? OR description LIKE ?')
        .get(pattern, pattern) as { total: number };
      return { rows, total };
    }

    const rows = db
      .prepare(`${SELECT_WITH_AUTHOR} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`)
      .all(limit, offset) as RecipeWithAuthor[];
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM recipes').get() as {
      total: number;
    };
    return { rows, total };
  },

  findById(id: number): RecipeWithAuthor | undefined {
    const db = getDb();
    return db.prepare(`${SELECT_WITH_AUTHOR} WHERE r.id = ?`).get(id) as
      | RecipeWithAuthor
      | undefined;
  },

  create(data: {
    title: string;
    description?: string;
    ingredients: string[];
    steps: string[];
    image_url?: string;
    cook_time?: number;
    servings?: number;
    author_id: number;
  }): RecipeWithAuthor {
    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO recipes (title, description, ingredients, steps, image_url, cook_time, servings, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
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
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(
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
  ): RecipeWithAuthor | undefined {
    const db = getDb();
    const now = new Date().toISOString();

    const sets: string[] = ['updated_at = ?'];
    const values: unknown[] = [now];

    if (data.title !== undefined) {
      sets.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      sets.push('description = ?');
      values.push(data.description);
    }
    if (data.ingredients !== undefined) {
      sets.push('ingredients = ?');
      values.push(JSON.stringify(data.ingredients));
    }
    if (data.steps !== undefined) {
      sets.push('steps = ?');
      values.push(JSON.stringify(data.steps));
    }
    if (data.image_url !== undefined) {
      sets.push('image_url = ?');
      values.push(data.image_url);
    }
    if (data.cook_time !== undefined) {
      sets.push('cook_time = ?');
      values.push(data.cook_time);
    }
    if (data.servings !== undefined) {
      sets.push('servings = ?');
      values.push(data.servings);
    }

    values.push(id);
    db.prepare(`UPDATE recipes SET ${sets.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id);
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
  },
};
