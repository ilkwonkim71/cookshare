import { newDb } from 'pg-mem';
import type { Pool } from 'pg';
import { setPool, closePool } from '../../src/db';
import { migrate } from '../../src/db/migrate';

// 각 테스트 파일마다 격리된 인메모리 Postgres(pg-mem)를 세팅한다.
export async function setupTestDb(): Promise<void> {
  const mem = newDb();
  const pg = mem.adapters.createPg();
  setPool(new pg.Pool() as unknown as Pool);
  await migrate();
}

export async function teardownTestDb(): Promise<void> {
  await closePool();
}
