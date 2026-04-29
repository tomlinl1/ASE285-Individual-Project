import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const userCreate = vi.fn();
const chatRoomCreate = vi.fn();
const chatRoomFindOne = vi.fn();
const messageCreate = vi.fn();
const messageFind = vi.fn();
const userFind = vi.fn();

vi.mock('../../../server/src/models/User.js', () => {
  return {
    User: {
      create: (...args: any[]) => userCreate(...args),
      findOne: vi.fn(),
      findById: vi.fn(),
      find: (...args: any[]) => userFind(...args),
    },
  };
});

vi.mock('../../../server/src/models/ChatRoom.js', () => {
  return {
    ChatRoom: {
      create: (...args: any[]) => chatRoomCreate(...args),
      findOne: (...args: any[]) => chatRoomFindOne(...args),
    },
  };
});

vi.mock('../../../server/src/models/Message.js', () => {
  return {
    Message: {
      create: (...args: any[]) => messageCreate(...args),
      find: (...args: any[]) => messageFind(...args),
    },
  };
});

describe('Acceptance: register → chat → message → export', () => {
  beforeEach(() => {
    vi.resetModules();
    userCreate.mockReset();
    chatRoomCreate.mockReset();
    chatRoomFindOne.mockReset();
    messageCreate.mockReset();
    messageFind.mockReset();
    userFind.mockReset();

    process.env.MONGODB_URI = 'mongodb://example.invalid/test';
    process.env.JWT_SECRET = 'secret';
    process.env.GEMINI_API_KEY = 'k';
  });

  it('completes a happy path flow', async () => {
    const userId = '507f1f77bcf86cd799439012';
    const chatId = '507f1f77bcf86cd799439011';

    userCreate.mockResolvedValue({ _id: userId, email: 'a@b.com' });

    chatRoomCreate.mockResolvedValue({
      _id: chatId,
      title: 'New chat',
      participants: [userId],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    chatRoomFindOne.mockReturnValue({
      exec: async () => ({ _id: chatId, participants: [userId], updatedAt: new Date(), save: vi.fn() }),
    });

    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    messageCreate.mockResolvedValue({
      _id: 'm1',
      chatRoomId: chatId,
      sender: 'user',
      model: '',
      content: 'Hello',
      createdAt,
      userId,
    });

    messageFind.mockReturnValue({
      sort: () => ({
        exec: async () => [
          {
            sender: 'user',
            model: '',
            content: 'Hello',
            createdAt,
            userId,
          },
        ],
      }),
    });

    userFind.mockReturnValue({
      select: () => ({
        exec: async () => [{ _id: userId, email: 'a@b.com' }],
      }),
    });

    const { createApp } = await import('../../../server/src/app');
    const app = createApp();

    const register = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'password123' });
    expect(register.status).toBe(201);
    const token = register.body.token as string;
    expect(token).toBeTruthy();

    const chat = await request(app).post('/api/chats').set('Authorization', `Bearer ${token}`).send({});
    expect(chat.status).toBe(201);
    expect(chat.body.id).toBe(chatId);

    const msg = await request(app)
      .post(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello' });
    expect(msg.status).toBe(201);
    expect(msg.body.content).toBe('Hello');

    const exported = await request(app)
      .get(`/api/chats/${chatId}/export`)
      .set('Authorization', `Bearer ${token}`);
    expect(exported.status).toBe(200);
    expect(exported.headers['content-type']).toContain('text/markdown');
    expect(exported.text).toContain('Hello');
  });
});

