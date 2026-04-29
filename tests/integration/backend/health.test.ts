import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MONGODB_URI = 'mongodb://example.invalid/test';
    process.env.JWT_SECRET = 'secret';
    process.env.GEMINI_API_KEY = 'k';
  });

  it('returns ok: true', async () => {
    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

