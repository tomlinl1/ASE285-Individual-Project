import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const chatRoomCreate = vi.fn();
const chatRoomFindOne = vi.fn();
const messageCreate = vi.fn();
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
      create: (...args: any[]) => chatRoomCreate(...args),
      findOne: (...args: any[]) => chatRoomFindOne(...args),
      find: vi.fn(),
      findById: vi.fn(),
    },
  };
});

vi.mock('../../../server/src/models/Message.js', () => {
  return {
    Message: {
      create: (...args: any[]) => messageCreate(...args),
      find: vi.fn(),
    },
  };
});

vi.mock('../../../server/src/models/User.js', () => {
  return {
    User: {
      find: (...args: any[]) => userFind(...args),
      findOne: vi.fn(),
      findById: vi.fn(),
    },
  };
});

describe('Chats routes', () => {
  beforeEach(() => {
    vi.resetModules();
    chatRoomCreate.mockReset();
    chatRoomFindOne.mockReset();
    messageCreate.mockReset();
    userFind.mockReset();

    process.env.MONGODB_URI = 'mongodb://example.invalid/test';
    process.env.JWT_SECRET = 'secret';
    process.env.GEMINI_API_KEY = 'k';
  });

  it('POST /api/chats creates a chat room', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    chatRoomCreate.mockResolvedValue({
      _id: 'c1',
      title: 'New chat',
      participants: ['507f1f77bcf86cd799439012'],
      createdAt: now,
      updatedAt: now,
    });

    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const res = await request(app).post('/api/chats').send({});
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 'c1',
      title: 'New chat',
      participants: ['507f1f77bcf86cd799439012'],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('POST /api/chats/:id/messages validates and creates message', async () => {
    const chatId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439012';
    const room = { _id: chatId, participants: [userId], updatedAt: new Date(), save: vi.fn() };
    chatRoomFindOne.mockReturnValue({ exec: async () => room });

    userFind.mockReturnValue({
      select: () => ({
        exec: async () => [{ _id: userId, email: 'me@example.com' }],
      }),
    });

    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    messageCreate.mockResolvedValue({
      _id: 'm1',
      chatRoomId: chatId,
      sender: 'user',
      model: '',
      content: 'hello',
      createdAt,
      userId,
    });

    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const res = await request(app).post(`/api/chats/${chatId}/messages`).send({ content: 'hello' });
    expect(res.status).toBe(201);
    expect(res.body.sender).toBe('user');
    expect(res.body.content).toBe('hello');
    expect(res.body.authorEmail).toBe('me@example.com');
  });
});

