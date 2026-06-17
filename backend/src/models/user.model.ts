import { getDb } from '../db';

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
  findByEmail(email: string): UserRow | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  },

  findById(id: number): UserRow | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  },

  create(data: { email: string; password_hash: string; name: string }): UserRow {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
    const result = stmt.run(data.email, data.password_hash, data.name);
    const created = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(result.lastInsertRowid) as UserRow;
    return created;
  },

  toPublic(user: UserRow): PublicUser {
    return { id: user.id, email: user.email, name: user.name };
  },
};
