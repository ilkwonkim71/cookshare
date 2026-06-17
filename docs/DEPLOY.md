# 배포 가이드

CookShare는 **프론트엔드(Vercel)** 와 **백엔드(Render)** 를 분리 배포합니다.
둘은 `NEXT_PUBLIC_API_URL`(프론트→백엔드)과 `CORS_ORIGIN`(백엔드가 허용할 프론트 도메인)으로 연결됩니다.
DB는 **Supabase Postgres**(외부)를 사용하므로 백엔드는 무상태입니다.

```
브라우저 ──https──▶ Vercel (Next.js)
   └────https, fetch(NEXT_PUBLIC_API_URL)────▶ Render (Express API) ──▶ Supabase Postgres
```

---

## 0. Supabase Postgres 준비 (먼저)

1. https://supabase.com → 새 프로젝트 생성 (무료, 카드 불필요)
2. **Settings → Database → Connection string → URI** 복사
   - 형식: `postgres://postgres:[PASSWORD]@db.[ref].supabase.co:5432/postgres`
   - 이 값이 백엔드 `DATABASE_URL` 입니다. (`DATABASE_SSL=true` 함께 사용)
3. 테이블은 백엔드 부팅 시 `migrate()` 가 자동 생성합니다(별도 SQL 불필요).

---

## 1. 백엔드 — Render (무료 Web Service)

루트의 `Dockerfile`(프로덕션)과 `render.yaml`(Blueprint)을 사용합니다.

### 1) Blueprint 배포

- Render → **New → Blueprint → Connect repo `ilkwonkim71/cookshare`**
- `render.yaml` 을 감지해 `cookshare-api` (Docker, free) 서비스를 만듭니다.
- `JWT_SECRET` 은 자동 생성됩니다.

### 2) 환경 변수 (대시보드에서 입력 — sync:false 항목)

| 변수              | 값                                                                |
| ----------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`    | Supabase 연결 문자열 (postgres://...)                             |
| `CORS_ORIGIN`     | Vercel 프론트 도메인 (예: `https://cookshare.vercel.app`)         |
| `PUBLIC_BASE_URL` | 이 서비스의 Render URL (예: `https://cookshare-api.onrender.com`) |

> `JWT_SECRET`/`DATABASE_SSL`/`STORAGE_DRIVER`/`UPLOAD_DIR`/`JWT_EXPIRES_IN` 은 `render.yaml` 이 설정합니다.
> `PORT` 는 Render가 자동 주입하며 앱이 그 값으로 listen합니다.

### 3) 도메인/헬스체크

- 배포 후 서비스 URL 확인 → `https://<render-url>/api/health` → `{"status":"ok"}`
- 무료 플랜은 유휴 시 슬립 → 첫 요청에 콜드스타트(수십 초) 발생할 수 있음(데모 OK).

> 대안: `railway.json` 으로 Railway 에도 배포 가능(무료 티어 없음). 자세한 변수는 위 표와 동일.

---

## 2. 프론트엔드 — Vercel

### 1) 프로젝트 설정

- **Settings → Build and Deployment → Root Directory = `frontend`**
- `frontend/vercel.json`이 install/build를 처리합니다
  (build: `pnpm --filter @cookshare/shared run build && next build`).

### 2) 환경 변수

| 변수                  | 값                             |
| --------------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL` | `https://<railway-domain>/api` |

### 3) 재배포

- Deployments → Redeploy (또는 새 커밋 push)

---

## 3. 연결 체크리스트

1. Railway 백엔드 `https://.../api/health` 200 OK 확인
2. Vercel `NEXT_PUBLIC_API_URL` = Railway 도메인 + `/api`
3. Railway `CORS_ORIGIN` = Vercel 도메인 (정확히 일치, 끝에 `/` 없음)
4. 둘 다 **https** (혼합 콘텐츠 차단 방지)
5. 프론트에서 회원가입 → 레시피 작성 동작 확인

## 주의 / 운영 고려

- **Postgres**: DB는 Supabase 등 외부 Postgres를 사용하므로 백엔드는 무상태 — 수평 확장 가능(업로드를 S3로 옮기면).
- **업로드 이미지**: 현재 로컬 디스크(Volume). 다중 인스턴스/영속성 강화 시 S3로 전환(`STORAGE_DRIVER=s3`, 리스크 R19).
- **JWT_SECRET**: 개발용 더미 값 재사용 금지(리스크 R1).
