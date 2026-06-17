import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import("jest").Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@cookshare/shared$': '<rootDir>/../packages/shared/src/index.ts',
  },
  // 단위 테스트 대상 레이어(프리미티브 UI + 유틸/api 클라이언트).
  // 페이지/조합 컴포넌트/컨텍스트는 Playwright E2E 및 통합 테스트가 담당.
  collectCoverageFrom: ['components/ui/**/*.{ts,tsx}', 'lib/utils.ts', 'lib/api.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: { statements: 50, branches: 30, functions: 38, lines: 50 },
  },
};

export default createJestConfig(config);
