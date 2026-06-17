# CookShare 🍳

레시피 공유 서비스. 사용자가 레시피를 등록하고, 이미지를 첨부하며, 다른 사람의 레시피를 둘러볼 수 있습니다.

## 기술 스택

| 영역     | 스택                                               |
| -------- | -------------------------------------------------- |
| Frontend | Next.js 14 (App Router), TypeScript, shadcn/ui     |
| Backend  | Express, TypeScript                                |
| Database | PostgreSQL (Supabase / 로컬 Docker, node-postgres) |
| 인증     | JWT (Bearer 토큰)                                  |
| 이미지   | 로컬 파일 저장 (S3 전환 가능한 스토리지 추상화)    |

## 프로젝트 구조

```
cookshare/
├── backend/    # Express + TypeScript API 서버 (포트 4000)
├── frontend/   # Next.js 14 앱 (포트 3000)
└── README.md
```

## 빠른 시작

### 1. 백엔드

```bash
cd backend
cp .env.example .env      # 환경 변수 설정 (JWT_SECRET 등)
npm install
npm run dev               # http://localhost:4000
```

### 2. 프론트엔드

```bash
cd frontend
cp .env.example .env.local # NEXT_PUBLIC_API_URL 설정
npm install
npm run dev                # http://localhost:3000
```

## API 개요

베이스 URL: `http://localhost:4000/api`

| 메서드 | 경로             | 설명                      | 인증 |
| ------ | ---------------- | ------------------------- | ---- |
| POST   | `/auth/register` | 회원가입                  | -    |
| POST   | `/auth/login`    | 로그인 (JWT 발급)         | -    |
| GET    | `/auth/me`       | 내 정보                   | ✅   |
| GET    | `/recipes`       | 레시피 목록               | -    |
| GET    | `/recipes/:id`   | 레시피 상세               | -    |
| POST   | `/recipes`       | 레시피 등록               | ✅   |
| PUT    | `/recipes/:id`   | 레시피 수정 (작성자)      | ✅   |
| DELETE | `/recipes/:id`   | 레시피 삭제 (작성자)      | ✅   |
| POST   | `/uploads`       | 이미지 업로드 (multipart) | ✅   |

업로드된 이미지는 `/uploads/*` 경로로 정적 제공됩니다.

## 이미지 스토리지

이미지 저장은 `backend/src/storage`의 `Storage` 인터페이스로 추상화되어 있습니다.
개발 환경은 `LocalStorage`(로컬 디스크)를 사용하며, 추후 `S3Storage` 구현을 추가하고
`STORAGE_DRIVER=s3` 환경 변수로 전환할 수 있습니다.
