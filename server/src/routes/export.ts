import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

export const exportRouter = Router();

exportRouter.use(requireAuth);

function toPlainText(
  messages: Array<{ sender: string; model: string; content: string; createdAt: string; authorEmail?: string }>
) {
  return messages
    .map((m) => {
      const who =
        m.sender === 'user'
          ? m.authorEmail ?? 'User'
          : `AI (${m.model || 'model'})`;
      return `[${m.createdAt}] ${who}\n${m.content}\n`;
    })
    .join('\n');
}

function toMarkdown(
  messages: Array<{ sender: string; model: string; content: string; createdAt: string; authorEmail?: string }>
) {
  return messages
    .map((m) => {
      const who =
        m.sender === 'user'
          ? m.authorEmail ?? 'User'
          : `AI (${m.model || 'model'})`;
      return `### ${who}  \n*${m.createdAt}*\n\n${m.content}\n`;
    })
    .join('\n');
}

exportRouter.get('/chats/:id/export', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const chatId = req.params.id;
  if (!mongoose.isValidObjectId(chatId)) return res.status(400).json({ error: 'Invalid chat id' });

  const room = await ChatRoom.findOne({ _id: chatId, participants: userId }).exec();
  if (!room) return res.status(404).json({ error: 'Chat not found' });

  const msgs = await Message.find({ chatRoomId: chatId }).sort({ createdAt: 1 }).exec();
  const userIds = [...new Set(msgs.filter((m) => m.userId).map((m) => String(m.userId)))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select('email').exec()
    : [];
  const emailMap = new Map(users.map((u) => [String(u._id), u.email]));
  const messages = msgs.map((m) => ({
    sender: m.sender,
    model: m.model ?? '',
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    authorEmail: m.userId ? emailMap.get(String(m.userId)) : undefined,
  }));

  const format = String(req.query.format ?? 'md');
  if (format === 'txt') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(toPlainText(messages));
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  return res.send(toMarkdown(messages));
});

