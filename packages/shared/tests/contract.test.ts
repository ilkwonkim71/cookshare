import {
  API_PREFIX,
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_PAGE_SIZE,
} from '../src/index';

describe('shared contract constants', () => {
  it('exposes the API prefix', () => {
    expect(API_PREFIX).toBe('/api');
  });

  it('limits uploads to 5MB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024);
  });

  it('allows the expected image MIME types', () => {
    expect(ALLOWED_IMAGE_MIME_TYPES).toContain('image/jpeg');
    expect(ALLOWED_IMAGE_MIME_TYPES).toContain('image/png');
    expect(ALLOWED_IMAGE_MIME_TYPES).toContain('image/webp');
    expect(ALLOWED_IMAGE_MIME_TYPES).not.toContain('image/svg+xml');
  });

  it('has a positive default page size', () => {
    expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
  });
});
