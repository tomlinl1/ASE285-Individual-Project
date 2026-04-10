import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { generateGeminiReply } from '../services/gemini.js';

type PopulatedParticipant = { _id: mongoose.Types.ObjectId; email: string };

async function emailByUserIds(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const users = await User.find({ _id: { $in: unique } }).select('email').exec();
  return new Map(users.map((u) => [String(u._id), u.email]));
}

function serializeMessage(
  m: { _id: unknown; chatRoomId: unknown; sender: string; model?: string; content: string; createdAt: Date; userId?: unknown },
  emailMap: Map<string, string>
) {
  const uid = m.userId ? String(m.userId) : undefined;
  return {
    id: String(m._id),
    chatRoomId: String(m.chatRoomId),
    sender: m.sender as 'user' | 'ai',
    model: m.model ?? '',
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    userId: uid,
    authorEmail: uid ? emailMap.get(uid) : undefined,
  };
}

export const chatsRouter = Router();

chatsRouter.use(requireAuth);

chatsRouter.get('/chats', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const rooms = await ChatRoom.find({ participants: userId })
    .sort({ updatedAt: -1 })
    .select('title participants createdAt updatedAt')
    .exec();

  return res.json(
    rooms.map((r) => ({
      id: String(r._id),
      title: r.title,
      participants: r.participants.map(String),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
});

const createChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

chatsRouter.post('/chats', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const parsed = createChatSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const room = await ChatRoom.create({
    title: parsed.data.title ?? 'New chat',
    participants: [new mongoose.Types.ObjectId(userId)],
  });

  return res.status(201).json({
    id: String(room._id),
    title: room.title,
    participants: room.participants.map(String),
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  });
});

chatsRouter.get('/chats/:id/messages', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const chatId = req.params.id;
  if (!mongoose.isValidObjectId(chatId)) return res.status(400).json({ error: 'Invalid chat id' });

  const room = await ChatRoom.findOne({ _id: chatId, participants: userId }).exec();
  if (!room) return res.status(404).json({ error: 'Chat not found' });

  const messages = await Message.find({ chatRoomId: chatId }).sort({ createdAt: 1 }).exec();
  const userIds = messages.filter((m) => m.userId).map((m) => String(m.userId));
  const emailMap = await emailByUserIds(userIds);
  return res.json(messages.map((m) => serializeMessage(m, emailMap)));
});

const createMessageSchema = z.object({
  content: z.string().min(1).max(20_000),
});

chatsRouter.post('/chats/:id/messages', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const chatId = req.params.id;
  if (!mongoose.isValidObjectId(chatId)) return res.status(400).json({ error: 'Invalid chat id' });

  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const room = await ChatRoom.findOne({ _id: chatId, participants: userId }).exec();
  if (!room) return res.status(404).json({ error: 'Chat not found' });

  const msg = await Message.create({
    chatRoomId: room._id,
    sender: 'user',
    model: '',
    content: parsed.data.content,
    userId: new mongoose.Types.ObjectId(userId),
  });
  room.updatedAt = new Date();
  await room.save();

  const emailMap = await emailByUserIds([String(userId)]);
  return res.status(201).json(serializeMessage(msg, emailMap));
});

chatsRouter.post('/chats/:id/ai-reply', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const chatId = req.params.id;
  if (!mongoose.isValidObjectId(chatId)) return res.status(400).json({ error: 'Invalid chat id' });

  const room = await ChatRoom.findOne({ _id: chatId, participants: userId }).exec();
  if (!room) return res.status(404).json({ error: 'Chat not found' });

  const history = await Message.find({ chatRoomId: chatId }).sort({ createdAt: 1 }).exec();
  const userIds = history.filter((m) => m.userId).map((m) => String(m.userId));
  const emailMap = await emailByUserIds(userIds);
  const turns = history.map((m) => {
    if (m.sender === 'ai') {
      return { role: 'model' as const, text: m.content };
    }
    const label = m.userId ? emailMap.get(String(m.userId)) ?? 'Student' : 'Student';
    return { role: 'user' as const, text: `[${label}]: ${m.content}` };
  });

  const reply = await generateGeminiReply(turns);

  const msg = await Message.create({
    chatRoomId: room._id,
    sender: 'ai',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    content: reply,
  });
  room.updatedAt = new Date();
  await room.save();

  return res.status(201).json(serializeMessage(msg, new Map()));
});

const inviteSchema = z.object({
  email: z.string().email().max(254),
});

chatsRouter.post('/chats/:id/participants', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const chatId = req.params.id;
  if (!mongoose.isValidObjectId(chatId)) return res.status(400).json({ error: 'Invalid chat id' });

  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const room = await ChatRoom.findOne({ _id: chatId, participants: userId }).exec();
  if (!room) return res.status(404).json({ error: 'Chat not found' });

  const email = parsed.data.email.toLowerCase();
  const invitee = await User.findOne({ email }).exec();
  if (!invitee) return res.status(404).json({ error: 'No user registered with that email' });

  if (room.participants.some((p: mongoose.Types.ObjectId) => String(p) === String(invitee._id))) {
    const existing = await ChatRoom.findById(room._id)
      .populate<{ participants: PopulatedParticipant[] }>('participants', 'email')
      .exec();
    if (!existing) return res.status(404).json({ error: 'Chat not found' });
    const parts = existing.participants as unknown as PopulatedParticipant[];
    return res.status(200).json({
      id: String(existing._id),
      title: existing.title,
      participants: parts.map((p) => String(p._id)),
      members: parts.map((p) => ({ id: String(p._id), email: p.email })),
      createdAt: existing.createdAt.toISOString(),
      updatedAt: existing.updatedAt.toISOString(),
    });
  }

  room.participants.push(invitee._id);
  room.updatedAt = new Date();
  await room.save();

  const populated = await ChatRoom.findById(room._id)
    .populate<{ participants: PopulatedParticipant[] }>('participants', 'email')
    .exec();

  if (!populated) return res.status(500).json({ error: 'Failed to load room' });

  const newParts = populated.participants as unknown as PopulatedParticipant[];
  return res.status(200).json({
    id: String(populated._id),
    title: populated.title,
    participants: newParts.map((p) => String(p._id)),
    members: newParts.map((p) => ({ id: String(p._id), email: p.email })),
    createdAt: populated.createdAt.toISOString(),
    updatedAt: populated.updatedAt.toISOString(),
  });
});

chatsRouter.get('/chats/:id/detail', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const chatId = req.params.id;
  if (!mongoose.isValidObjectId(chatId)) return res.status(400).json({ error: 'Invalid chat id' });

  const room = await ChatRoom.findOne({ _id: chatId, participants: userId })
    .populate<{ participants: PopulatedParticipant[] }>('participants', 'email')
    .exec();
  if (!room) return res.status(404).json({ error: 'Chat not found' });

  const detailParts = room.participants as unknown as PopulatedParticipant[];
  return res.json({
    id: String(room._id),
    title: room.title,
    participants: detailParts.map((p) => String(p._id)),
    members: detailParts.map((p) => ({ id: String(p._id), email: p.email })),
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  });
});

