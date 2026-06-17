// Conventional Commits 규칙 검증 (CONTRIBUTING.md와 동일한 type 세트)
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 기능
        'fix', // 버그 수정
        'refactor', // 리팩터링
        'chore', // 잡무/설정
        'docs', // 문서
        'test', // 테스트
        'security', // 보안
        'build', // 빌드 시스템
        'ci', // CI 설정
        'perf', // 성능
        'style', // 포맷/스타일(동작 변화 없음)
        'revert', // 되돌리기
      ],
    ],
    // scope 예: backend, frontend, shared, db, auth, upload (선택 사항)
    'subject-case': [0], // 한글 제목 허용을 위해 대소문자 규칙 비활성화
    'header-max-length': [2, 'always', 100],
  },
};
