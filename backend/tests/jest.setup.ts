// 모듈 임포트 전에 환경 변수 설정 (config/env 의 requireEnv 통과 + 인메모리 DB)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_PATH = ':memory:';
process.env.STORAGE_DRIVER = 'local';
process.env.UPLOAD_DIR = './uploads';
process.env.PUBLIC_BASE_URL = 'http://localhost:4000';
process.env.CORS_ORIGIN = 'http://localhost:3000';
