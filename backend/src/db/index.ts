import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    if (env.DATABASE_PATH === ':memory:') {
      // 테스트용 인메모리 DB (프로세스 단위 격리)
      _db = new Database(':memory:');
    } else {
      const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      _db = new Database(dbPath);
      _db.pragma('journal_mode = WAL');
    }
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}
