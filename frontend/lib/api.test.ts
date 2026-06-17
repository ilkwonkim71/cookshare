import { login, deleteRecipe } from './api';

describe('api error handling', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses the backend error envelope { error: { message } }', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: '이메일 또는 비밀번호가 올바르지 않습니다', code: 'INVALID_CREDENTIALS' },
      }),
    }) as unknown as typeof fetch;

    await expect(login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
      '이메일 또는 비밀번호가 올바르지 않습니다',
    );
  });

  it('returns parsed json on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 't0ken', user: { id: 1, name: 'A', email: 'a@b.com' } }),
    }) as unknown as typeof fetch;

    const res = await login({ email: 'a@b.com', password: 'x' });
    expect(res.token).toBe('t0ken');
    expect(res.user.email).toBe('a@b.com');
  });

  // 회귀 방지: 204 No Content(DELETE)는 본문 파싱을 시도하면 안 됨
  it('resolves on a 204 response without parsing the body', async () => {
    const json = jest.fn(async () => {
      throw new Error('204 응답은 json() 을 호출하면 안 됩니다');
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json,
    }) as unknown as typeof fetch;

    await expect(deleteRecipe('1')).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });
});
