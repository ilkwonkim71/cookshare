import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb } from '../helpers/testDb';

const app = createApp();
const email = `user${Date.now()}@test.com`;

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('auth API', () => {
  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Tester' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Tester' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_CONFLICT');
  });

  it('rejects invalid registration payload with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123', name: '' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('rejects /me without a token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
