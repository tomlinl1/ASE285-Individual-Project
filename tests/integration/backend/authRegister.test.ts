import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const userCreate = vi.fn();

vi.mock('../../../server/src/models/User.js', () => {
  return {
    User: {
      create: (...args: any[]) => userCreate(...args),
      findOne: vi.fn(),
      findById: vi.fn(),
    },
  };
});

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.resetModules();
    userCreate.mockReset();

    process.env.MONGODB_URI = 'mongodb://example.invalid/test';
    process.env.JWT_SECRET = 'secret';
    process.env.GEMINI_API_KEY = 'k';
  });

  it('returns 201 with token and user on success', async () => {
    userCreate.mockResolvedValue({ _id: 'u1', email: 'a@b.com' });

    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'A@B.COM', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: 'u1', email: 'a@b.com' });
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 409 when email already exists', async () => {
    userCreate.mockRejectedValue(new Error('E11000 duplicate key error collection'));

    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Email already in use' });
  });

  it('returns 400 on invalid input', async () => {
    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid input' });
  });
});

