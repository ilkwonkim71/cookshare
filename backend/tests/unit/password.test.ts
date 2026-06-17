import { hashPassword, comparePassword } from '../../src/utils/password';

describe('password utils', () => {
  it('hashes a password to a different string', async () => {
    const hash = await hashPassword('s3cret!');
    expect(hash).not.toBe('s3cret!');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('s3cret!');
    expect(await comparePassword('s3cret!', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('s3cret!');
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});
