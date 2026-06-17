import { test, expect } from '@playwright/test';

test('backend health endpoint is ok', async ({ request }) => {
  const res = await request.get('http://localhost:4000/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('home page loads', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
});

test('register page is reachable', async ({ page }) => {
  await page.goto('/register');
  await expect(page).toHaveURL(/\/register/);
  // 이메일/비밀번호 입력 필드가 렌더되는지 (UI 텍스트에 의존하지 않음)
  await expect(page.locator('input[type="email"], input[type="password"]').first()).toBeVisible();
});
