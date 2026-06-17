import fs from 'fs';
import path from 'path';
import { Storage, SaveResult } from './storage';
import { env } from '../config/env';

export class LocalStorage implements Storage {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(buffer: Buffer, filename: string, _mimetype: string): Promise<SaveResult> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const ext = path.extname(filename) || '';
    const key = `${timestamp}-${randomSuffix}${ext}`;
    const filePath = path.join(this.uploadDir, key);

    await fs.promises.writeFile(filePath, buffer);

    const url = `${env.PUBLIC_BASE_URL}/uploads/${key}`;
    return { url, key };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      // Silently ignore if file doesn't exist
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }
}
