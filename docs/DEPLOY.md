# 배포 가이드

CookShare는 **프론트엔드(Vercel)** 와 **백엔드(Railway)** 를 분리 배포합니다.
둘은 `NEXT_PUBLIC_API_URL`(프론트→백엔드)과 `CORS_ORIGIN`(백엔드가 허용할 프론트 도메인)으로 연결됩니다.

```
브라우저 ──https──▶ Vercel (Next.js)
   └────https, fetch(NEXT_PUBLIC_API_URL)────▶ Railway (Express API) ──▶ Supabase Postgres
```

---

## 1. 백엔드 — Railway

루트의 `Dockerfile`(프로덕션)과 `railway.json`을 사용합니다.

### 1) 프로젝트 생성

- Railway → **New Project → Deploy from GitHub repo → `ilkwonkim71/cookshare`**
- Railway가 루트 `Dockerfile` + `railway.json`을 감지해 빌드합니다.

### 2) Supabase Postgres 준비

- Supabase → **Settings → Database → Connection string (URI)** 복사 → `DATABASE_URL` 에 사용
- (선택) 업로드 영속이 필요하면 Railway Volume 을 `UPLOAD_DIR` 경로에 마운트하거나 S3로 전환

### 3) 환경 변수 (Variables)

| 변수              | 값                                                               |
| ----------------- | ---------------------------------------------------------------- |
| `JWT_SECRET`      | **강력한 랜덤 값** (필수 — 없으면 부팅 실패)                     |
| `JWT_EXPIRES_IN`  | `7d`                                                             |
| `DATABASE_URL`    | Supabase 연결 문자열 (postgres://...)                            |
| `DATABASE_SSL`    | `true` (Supabase 등 관리형은 SSL 필요)                           |
| `UPLOAD_DIR`      | `./uploads` (또는 마운트한 볼륨 경로)                            |
| `STORAGE_DRIVER`  | `local`                                                          |
| `PUBLIC_BASE_URL` | Railway 공개 도메인 (예: `https://cookshare-api.up.railway.app`) |
| `CORS_ORIGIN`     | Vercel 프론트 도메인 (예: `https://cookshare.vercel.app`)        |

> `PORT`는 Railway가 자동 주입하며 앱이 그 값으로 listen합니다(코드 수정 불필요).

### 4) 도메인 확인

- 서비스 → **Settings → Networking → Generate Domain** → 그 URL이 백엔드 공개 주소입니다.
- 헬스체크: `https://<railway-domain>/api/health` → `{"status":"ok"}`

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
