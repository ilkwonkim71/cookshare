import './config/env'; // Load env vars first
import { env } from './config/env';
import { migrate } from './db/migrate';
import { createApp } from './app';

async function main(): Promise<void> {
  // Run DB migrations
  migrate();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[Server] CookShare backend running on http://localhost:${env.PORT}`);
    console.log(`[Server] Storage driver: ${env.STORAGE_DRIVER}`);
    console.log(`[Server] Database: ${env.DATABASE_PATH}`);
  });
}

main().catch((err) => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});
