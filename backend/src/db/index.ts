import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { env } from '../config/env';

let _pool: Pool | null = null;

// 테스트(pg-mem) 등에서 풀을 주입하기 위한 훅
export function setPool(pool: Pool): void {
  _pool = pool;
}

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
    });
  }
  return _pool;
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as unknown[]);
}

export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
