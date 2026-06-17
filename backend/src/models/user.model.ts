import { query } from '../db';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
}

export const UserModel = {
  async findByEmail(email: string): Promise<UserRow | undefined> {
    const res = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  },

  async findById(id: number): Promise<UserRow | undefined> {
    const res = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
  },

  async create(data: { email: string; password_hash: string; name: string }): Promise<UserRow> {
    const createdAt = new Date().toISOString();
    const res = await query<UserRow>(
      'INSERT INTO users (email, password_hash, name, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.email, data.password_hash, data.name, createdAt],
    );
    return res.rows[0];
  },

  toPublic(user: UserRow): PublicUser {
    return { id: user.id, email: user.email, name: user.name };
  },
};
