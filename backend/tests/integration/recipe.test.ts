import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb } from '../helpers/testDb';

const app = createApp();

async function registerAndLogin(email: string): Promise<string> {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: 'Owner' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return res.body.token as string;
}

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('recipe API', () => {
  let token: string;
  let recipeId: number;

  beforeAll(async () => {
    token = await registerAndLogin(`owner${Date.now()}@test.com`);
  });

  it('creates a recipe and serializes arrays', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '김치찌개',
        description: '얼큰한 김치찌개',
        ingredients: ['김치', '돼지고기', '두부'],
        steps: ['재료를 볶는다', '물을 붓고 끓인다'],
        cookTime: 30,
        servings: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.recipe.id).toBeDefined();
    expect(res.body.recipe.ingredients).toEqual(['김치', '돼지고기', '두부']);
    expect(res.body.recipe.author.name).toBe('Owner');
    recipeId = res.body.recipe.id;
  });

  it('requires auth to create (401)', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ title: 'x', ingredients: ['a'], steps: ['b'] });
    expect(res.status).toBe(401);
  });

  it('lists recipes with a total count', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('finds recipes by search query', async () => {
    const res = await request(app).get('/api/recipes').query({ q: '김치' });
    expect(res.status).toBe(200);
    expect(res.body.recipes.length).toBeGreaterThanOrEqual(1);
  });

  it('gets a recipe by id', async () => {
    const res = await request(app).get(`/api/recipes/${recipeId}`);
    expect(res.status).toBe(200);
    expect(res.body.recipe.title).toBe('김치찌개');
  });

  it('updates the owner’s recipe', async () => {
    const res = await request(app)
      .put(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '부대찌개' });
    expect(res.status).toBe(200);
    expect(res.body.recipe.title).toBe('부대찌개');
  });

  it('forbids updating another user’s recipe (403)', async () => {
    const otherToken = await registerAndLogin(`other${Date.now()}@test.com`);
    const res = await request(app)
      .put(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'hacked' });
    expect(res.status).toBe(403);
  });

  it('deletes the owner’s recipe and then 404s', async () => {
    const del = await request(app)
      .delete(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const after = await request(app).get(`/api/recipes/${recipeId}`);
    expect(after.status).toBe(404);
  });

  it('returns 404 for a missing recipe', async () => {
    const res = await request(app).get('/api/recipes/999999');
    expect(res.status).toBe(404);
  });
});
