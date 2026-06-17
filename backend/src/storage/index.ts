import { Storage } from './storage';
import { LocalStorage } from './local.storage';
import { env } from '../config/env';

// Storage factory — returns the appropriate storage driver based on STORAGE_DRIVER env var.
// Currently supports: 'local' (writes to UPLOAD_DIR on disk).
// To add S3: install @aws-sdk/client-s3, implement S3Storage implementing Storage,
// and add a case 's3' below that returns new S3Storage().
function createStorage(): Storage {
  switch (env.STORAGE_DRIVER) {
    case 'local':
      return new LocalStorage();

    // case 's3':
    //   return new S3Storage();

    default:
      throw new Error(`Unsupported storage driver: ${env.STORAGE_DRIVER}`);
  }
}

export const storage: Storage = createStorage();
