# 기여 가이드 (Contributing)

CookShare에 기여해 주셔서 감사합니다. 이 문서는 협업 규칙을 요약합니다.
코드 구조와 명령어는 [`CLAUDE.md`](./CLAUDE.md), 제품 범위는 [`docs/`](./docs)를 참고하세요.

## 시작하기

저장소는 `backend/`와 `frontend/`가 **각각 독립적으로 설치**되는 구조입니다.

```bash
# 백엔드
cd backend && cp .env.example .env && npm install && npm run dev   # :4000

# 프론트엔드 (새 터미널)
cd frontend && cp .env.example .env.local && npm install && npm run dev  # :3000
```

## 브랜치 전략

- `main` — 배포 가능한 상태 유지. 직접 푸시 금지, PR로만 병합.
- 작업 브랜치: `<type>/<요약>` 형식
  - `feat/recipe-edit-page`, `fix/api-error-parsing`, `chore/ci-pipeline`, `docs/architecture`

## 커밋 메시지 (Conventional Commits)

```
<type>(<scope>): <요약>

[본문 — 선택]
```

- **type**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `security`
- **scope**(선택): `backend`, `frontend`, `db`, `auth`, `upload` 등
- 예: `feat(frontend): 레시피 수정 페이지 추가`, `fix(backend): 업로드 확장자를 MIME에서 도출`

## PR 절차

1. 이슈를 먼저 생성/할당 (사용자 스토리·버그·기능 템플릿 사용).
2. 작업 브랜치에서 구현 후 PR 생성 — `PULL_REQUEST_TEMPLATE.md`가 자동 로드됩니다.
3. PR 본문에 `Closes #이슈번호`와 관련 스토리/리스크 ID를 명시.
4. 아래 검증을 통과해야 리뷰 요청 가능.
5. 최소 1인 리뷰 승인 후 병합 (squash merge 권장).

## 검증 (제출 전 필수)

테스트 러너는 아직 없습니다. 현재 게이트는 타입/빌드/린트입니다.

| 영역     | 명령어              |
| -------- | ------------------- |
| backend  | `npm run typecheck` |
| frontend | `npm run build`     |
| frontend | `npm run lint`      |

## 라벨 & 마일스톤

- 모든 이슈에 **우선순위**(`P0`/`P1`/`P2`)와 **영역**(`area: *`) 라벨을 지정합니다.
- 작업 이슈는 해당 **스프린트 마일스톤**(S1~S6)에 연결합니다.
- 정의/생성 스크립트: [`.github/labels.md`](./.github/labels.md), [`.github/milestones.md`](./.github/milestones.md)

## 코드 작성 시 주의 (프로젝트 고유)

자세한 내용은 `CLAUDE.md`에 있으며, 특히 다음을 지켜주세요.

- **FE ↔ BE 계약**: API DTO는 camelCase, DB 행은 snake_case. 에러 응답은 항상
  `{ error: { message, code } }` 형식. 한쪽을 바꾸면 반대편(`lib/api.ts` ↔ 컨트롤러)도 함께 수정.
- **DB 접근**: 모델 계층에서 prepared statement로만. `ingredients`/`steps`는 JSON 문자열로 저장하고 DTO에서 배열로 변환.
- **스토리지**: 파일 저장은 `Storage` 인터페이스를 통해서만. S3 등 드라이버 추가는 `storage/index.ts` 팩토리에.
- **환경변수**: `config/env.ts`(백엔드)를 통해서만 접근. 새 변수는 `.env.example`에 반드시 추가.
- **마이그레이션**: 스키마 변경은 `db/migrate.ts`에 직접 반영(버전 관리 도구 없음).

## 보안

보안 취약점은 공개 이슈 대신 비공개 보안 권고(Security Advisory)로 신고해 주세요.
알려진 리스크 목록은 [`docs/RISK-ANALYSIS.md`](./docs/RISK-ANALYSIS.md)에 있습니다.
