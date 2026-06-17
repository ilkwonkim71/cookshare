import { signToken, verifyToken } from '../../src/utils/jwt';

describe('jwt utils', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signToken({ sub: 1, email: 'a@b.com', name: 'Alice' });
    const payload = verifyToken(token);
    expect(payload.sub).toBe(1);
    expect(payload.email).toBe('a@b.com');
    expect(payload.name).toBe('Alice');
  });

  it('throws on a malformed token', () => {
    expect(() => verifyToken('not-a-jwt')).toThrow();
  });
});
