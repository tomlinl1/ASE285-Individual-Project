import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const chatRoomFindOne = vi.fn();
const messageFind = vi.fn();
const userFind = vi.fn();

vi.mock('../../../server/src/middleware/requireAuth.js', () => {
  return {
    requireAuth: (req: any, _res: any, next: any) => {
      req.userId = '507f1f77bcf86cd799439012';
      next();
    },
  };
});

vi.mock('../../../server/src/models/ChatRoom.js', () => {
  return {
    ChatRoom: {
      findOne: (...args: any[]) => chatRoomFindOne(...args),
    },
  };
});

vi.mock('../../../server/src/models/Message.js', () => {
  return {
    Message: {
      find: (...args: any[]) => messageFind(...args),
    },
  };
});

vi.mock('../../../server/src/models/User.js', () => {
  return {
    User: {
      find: (...args: any[]) => userFind(...args),
    },
  };
});

describe('GET /api/chats/:id/export', () => {
  beforeEach(() => {
    vi.resetModules();
    chatRoomFindOne.mockReset();
    messageFind.mockReset();
    userFind.mockReset();

    process.env.MONGODB_URI = 'mongodb://example.invalid/test';
    process.env.JWT_SECRET = 'secret';
    process.env.GEMINI_API_KEY = 'k';
  });

  it('returns markdown by default', async () => {
    const chatId = '507f1f77bcf86cd799439011';
    chatRoomFindOne.mockReturnValue({
      exec: async () => ({ _id: chatId, participants: ['507f1f77bcf86cd799439012'] }),
    });

    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    messageFind.mockReturnValue({
      sort: () => ({
        exec: async () => [
          {
            sender: 'user',
            model: '',
            content: 'Hello',
            createdAt,
            userId: '507f1f77bcf86cd799439012',
          },
        ],
      }),
    });

    userFind.mockReturnValue({
      select: () => ({
        exec: async () => [{ _id: '507f1f77bcf86cd799439012', email: 'me@example.com' }],
      }),
    });

    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const res = await request(app).get(`/api/chats/${chatId}/export`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toContain('### me@example.com');
    expect(res.text).toContain('Hello');
  });

  it('returns text/plain when format=txt', async () => {
    const chatId = '507f1f77bcf86cd799439011';
    chatRoomFindOne.mockReturnValue({
      exec: async () => ({ _id: chatId, participants: ['507f1f77bcf86cd799439012'] }),
    });

    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    messageFind.mockReturnValue({
      sort: () => ({
        exec: async () => [
          {
            sender: 'ai',
            model: 'gemini-2.5-flash',
            content: 'Hi there',
            createdAt,
          },
        ],
      }),
    });

    userFind.mockReturnValue({
      select: () => ({
        exec: async () => [],
      }),
    });

    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const res = await request(app).get(`/api/chats/${chatId}/export?format=txt`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('AI (gemini-2.5-flash)');
    expect(res.text).toContain('Hi there');
  });
});

