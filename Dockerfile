# 프로덕션 백엔드 이미지 (Railway 등 컨테이너 호스트용)
# @cookshare/shared 를 먼저 빌드한 뒤 backend 를 컴파일하고 node 로 실행한다.
FROM node:22-bookworm-slim

# better-sqlite3 네이티브 빌드 대비(프리빌트 실패 시 폴백)
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# 매니페스트 먼저 복사 → 의존성 레이어 캐시
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# 워크스페이스 설치 (better-sqlite3/esbuild 네이티브 포함). devDeps 필요(typescript)
RUN pnpm install --frozen-lockfile

# 소스 복사 후 shared → backend 빌드 (backend build 스크립트가 shared 를 먼저 빌드)
COPY . .
RUN pnpm --filter @cookshare/backend run build

# 런타임 설정
ENV NODE_ENV=production
# 포트는 호스트(Railway)가 PORT 로 주입. 기본 4000.
EXPOSE 4000

# 컨테이너 cwd=/app. DATABASE_PATH/UPLOAD_DIR 는 절대경로(/data/...)로 주입 권장.
CMD ["node", "backend/dist/index.js"]
