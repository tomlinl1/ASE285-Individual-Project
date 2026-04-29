import { describe, expect, it, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

describe('requireAuth middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MONGODB_URI = 'mongodb://example.invalid/test';
    process.env.JWT_SECRET = 'secret';
    process.env.GEMINI_API_KEY = 'k';
  });

  it('rejects missing Authorization header', async () => {
    const { requireAuth } = await import('../../../server/src/middleware/requireAuth');

    const req = {
      header: () => undefined,
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid token', async () => {
    const { requireAuth } = await import('../../../server/src/middleware/requireAuth');

    const req = {
      header: () => 'Bearer bad',
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid token and sets req.userId', async () => {
    const { requireAuth } = await import('../../../server/src/middleware/requireAuth');

    const token = jwt.sign({}, process.env.JWT_SECRET!, { subject: 'u1', expiresIn: '1h' });
    const req = {
      header: () => `Bearer ${token}`,
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    requireAuth(req, res, next);
    expect(req.userId).toBe('u1');
    expect(next).toHaveBeenCalled();
  });
});

