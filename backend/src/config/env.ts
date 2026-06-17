import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  PORT: parseInt(optionalEnv('PORT', '4000'), 10),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '7d'),
  DATABASE_PATH: optionalEnv('DATABASE_PATH', './data/cookshare.sqlite'),
  STORAGE_DRIVER: optionalEnv('STORAGE_DRIVER', 'local') as 'local' | 's3',
  UPLOAD_DIR: optionalEnv('UPLOAD_DIR', './uploads'),
  PUBLIC_BASE_URL: optionalEnv('PUBLIC_BASE_URL', 'http://localhost:4000'),
  CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),
} as const;
