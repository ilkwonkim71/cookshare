import { test, expect } from "@playwright/test";

// MVP 핵심 플로우를 단일 컨텍스트(로그인 상태 유지)에서 end-to-end 검증한다.
const unique = Date.now();
const account = {
  name: "E2E 테스터",
  email: `e2e${unique}@test.com`,
  password: "password123",
};
const recipeTitle = `테스트 김치찌개 ${unique}`;

test("guest is redirected from a protected page to login", async ({ page }) => {
  await page.goto("/recipes/new");
  await expect(page).toHaveURL(/\/login/);
});

test("full MVP flow: register -> create -> browse -> delete", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  // 1) 회원가입 -> 자동 로그인 -> 홈
  await page.goto("/register");
  await page.fill("#name", account.name);
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await page.getByRole("button", { name: "회원가입" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(account.name).first()).toBeVisible();

  // 2) 레시피 작성
  await page.goto("/recipes/new");
  await expect(page.locator("#title")).toBeVisible();
  await page.fill("#title", recipeTitle);
  await page.getByLabel("재료 1").fill("김치 1/2포기");
  await page.getByLabel("조리 단계 1").fill("냄비에 김치와 물을 넣고 끓인다.");
  await page.getByRole("button", { name: "레시피 등록" }).click();

  // 상세 페이지로 이동 + 제목/재료 확인
  await expect(page).toHaveURL(/\/recipes\/\d+/);
  await expect(page.getByRole("heading", { name: recipeTitle })).toBeVisible();
  await expect(page.getByText("김치 1/2포기")).toBeVisible();

  // 3) 홈에서 검색으로 노출 확인 (카드 제목 heading 으로 특정)
  await page.goto("/");
  await page.getByPlaceholder("레시피 검색...").fill(recipeTitle);
  await page.getByRole("button", { name: "검색" }).click();
  await expect(page.getByRole("heading", { name: recipeTitle })).toBeVisible();

  // 4) 상세 진입 후 작성자 본인이 삭제 (confirm 다이얼로그 수락)
  await page.getByRole("heading", { name: recipeTitle }).click();
  await expect(page).toHaveURL(/\/recipes\/\d+/);
  await page.getByRole("button", { name: "레시피 삭제" }).click();

  // 홈으로 복귀 + 검색 시 더 이상 없음
  await expect(page).toHaveURL("/");
  await page.getByPlaceholder("레시피 검색...").fill(recipeTitle);
  await page.getByRole("button", { name: "검색" }).click();
  await expect(page.getByText("레시피가 없습니다")).toBeVisible();
});

