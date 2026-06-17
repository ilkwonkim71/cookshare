export interface SaveResult {
  url: string;
  key: string;
}

export interface Storage {
  save(buffer: Buffer, filename: string, mimetype: string): Promise<SaveResult>;
  delete(key: string): Promise<void>;
}
