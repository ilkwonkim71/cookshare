// 모듈 임포트 전에 환경 변수 설정 (config/env 의 requireEnv 통과)
// 실제 DB 연결은 tests/helpers/testDb 의 pg-mem 풀을 주입해 대체한다.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.STORAGE_DRIVER = 'local';
process.env.UPLOAD_DIR = './uploads';
process.env.PUBLIC_BASE_URL = 'http://localhost:4000';
process.env.CORS_ORIGIN = 'http://localhost:3000';
