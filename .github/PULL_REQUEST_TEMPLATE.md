<!--
PR 제목: [영역] 간결한 설명   예) [backend] 업로드 확장자 MIME 역도출
-->

## 개요

<!-- 무엇을, 왜 변경했는지 1~3줄 -->

## 관련 이슈

<!-- Closes #이슈번호 / 관련 스토리 ID(US-x.x) 또는 리스크 ID(Rx) -->

- Closes #

## 변경 유형

- [ ] ✨ 기능 (feature)
- [ ] 🐛 버그 수정 (bugfix)
- [ ] ♻️ 리팩터링
- [ ] 🔒 보안
- [ ] 📝 문서
- [ ] 🔧 인프라/설정

## 영역

- [ ] frontend (Next.js)
- [ ] backend (Express)
- [ ] docs / infra

## 변경 내용

## <!-- 주요 변경점을 항목으로 -->

## 검증

<!-- 실제로 돌린 것에 체크. 없는 항목은 지우지 말고 비워두세요. -->

- [ ] backend `npm run typecheck` 통과
- [ ] frontend `npm run build` 통과
- [ ] frontend `npm run lint` 통과
- [ ] 로컬에서 동작 확인 (가입 → 작성 → 조회 등 관련 흐름)

## 계약 영향 (FE ↔ BE)

<!-- CLAUDE.md의 "Cross-cutting contract" 참고. API/필드/에러 형식 변경 시 양쪽 확인 -->

- [ ] API 엔드포인트/필드 변경 없음
- [ ] 변경 있음 → 반대편(`lib/api.ts` 또는 컨트롤러) 함께 수정함
- [ ] 에러 응답 형식 `{ error: { message, code } }` 유지

## 스크린샷 / 로그 (UI·동작 변경 시)

## 체크리스트

- [ ] 기본/약한 시크릿, 키 등 민감정보를 커밋에 포함하지 않음
- [ ] 새 환경변수 추가 시 `.env.example`에 반영함
- [ ] 관련 문서(`docs/`, `README.md`, `CLAUDE.md`) 갱신 필요 여부 확인함
