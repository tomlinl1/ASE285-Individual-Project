import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const userFindOne = vi.fn();
const bcryptCompare = vi.fn();

vi.mock('../../../server/src/models/User.js', () => {
  return {
    User: {
      create: vi.fn(),
      findById: vi.fn(),
      findOne: (...args: any[]) => userFindOne(...args),
    },
  };
});

vi.mock('bcryptjs', async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return { ...original, compare: (...args: any[]) => bcryptCompare(...args) };
});

describe('Regression: auth login generic error', () => {
  beforeEach(() => {
    vi.resetModules();
    userFindOne.mockReset();
    bcryptCompare.mockReset();

    process.env.MONGODB_URI = 'mongodb://example.invalid/test';
    process.env.JWT_SECRET = 'secret';
    process.env.GEMINI_API_KEY = 'k';
  });

  it('returns same error message for wrong password and unknown user', async () => {
    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    // Unknown user
    userFindOne.mockReturnValue({ exec: async () => null });
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'password123' });
    expect(res1.status).toBe(401);
    expect(res1.body).toEqual({ error: 'Invalid email or password' });

    // Known user but wrong password
    userFindOne.mockReturnValue({ exec: async () => ({ _id: 'u1', email: 'a@b.com', passwordHash: 'hash' }) });
    bcryptCompare.mockResolvedValue(false);
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'password123' });
    expect(res2.status).toBe(401);
    expect(res2.body).toEqual({ error: 'Invalid email or password' });
  });
});

