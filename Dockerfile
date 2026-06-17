# 프로덕션 백엔드 이미지 (Railway 등 컨테이너 호스트용)
# @cookshare/shared 를 먼저 빌드한 뒤 backend 를 컴파일하고 node 로 실행한다.
# DB는 외부 Postgres(Supabase 등)를 DATABASE_URL 로 사용한다. (pg = 순수 JS, 네이티브 빌드 불필요)
FROM node:22-bookworm-slim

ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# 매니페스트 먼저 복사 → 의존성 레이어 캐시
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# 워크스페이스 설치. devDeps 필요(typescript)
RUN pnpm install --frozen-lockfile

# 소스 복사 후 shared -> backend 빌드 (backend build 스크립트가 shared 를 먼저 빌드)
COPY . .
RUN pnpm --filter @cookshare/backend run build

ENV NODE_ENV=production
# 포트는 호스트(Railway)가 PORT 로 주입. 기본 4000.
EXPOSE 4000

# DATABASE_URL(Postgres), JWT_SECRET 등은 호스트 환경변수로 주입.
# 업로드 영속이 필요하면 UPLOAD_DIR 를 볼륨 경로로 지정.
CMD ["node", "backend/dist/index.js"]
