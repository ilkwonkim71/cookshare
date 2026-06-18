import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 설정. webServer 가 백엔드(:4000)와 프론트(:3000)를 자동 기동한다.
 * 로컬에서 두 서버가 이미 떠 있으면 재사용한다(reuseExistingServer).
 * 사전에 브라우저 설치 필요: pnpm test:e2e:install
 *
 * DB: 백엔드는 backend/.env 의 DATABASE_URL(Supabase pooler) 를 그대로 사용한다.
 *     비밀번호를 이 파일에 하드코딩하지 않기 위해 DB 관련 env 는 여기서 주입하지 않는다.
 *     (dotenv 는 이미 설정된 process.env 를 덮어쓰지 않으므로 아래 JWT 등만 오버라이드된다.)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @cookshare/shared run build && pnpm --filter @cookshare/backend run dev',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NODE_ENV: 'development',
        PORT: '4000',
        JWT_SECRET: 'e2e-secret',
        JWT_EXPIRES_IN: '7d',
        STORAGE_DRIVER: 'local',
        UPLOAD_DIR: './uploads',
        PUBLIC_BASE_URL: 'http://localhost:4000',
        CORS_ORIGIN: 'http://localhost:3000',
      },
    },
    {
      command: 'pnpm --filter @cookshare/frontend exec next dev -p 3000',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: 'http://localhost:4000/api',
      },
    },
  ],
});