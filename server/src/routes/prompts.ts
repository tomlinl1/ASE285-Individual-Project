import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';
import { Prompt } from '../models/Prompt.js';

export const promptsRouter = Router();

promptsRouter.use(requireAuth);

promptsRouter.get('/prompts', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const visibility = req.query.visibility;

  let filter: Record<string, unknown>;
  if (visibility === 'public') filter = { visibility: 'public' };
  else if (visibility === 'mine') filter = { ownerUserId: userId };
  else filter = { $or: [{ visibility: 'public' }, { ownerUserId: userId }] };

  const prompts = await Prompt.find(filter).sort({ upvotes: -1, updatedAt: -1 }).exec();
  return res.json(
    prompts.map((p) => ({
      id: String(p._id),
      title: p.title,
      content: p.content,
      tags: p.tags ?? [],
      visibility: p.visibility,
      ownerUserId: String(p.ownerUserId),
      upvotes: p.upvotes ?? 0,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
});

const promptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50_000),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

promptsRouter.post('/prompts', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const parsed = promptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const prompt = await Prompt.create({
    ...parsed.data,
    tags: parsed.data.tags ?? [],
    visibility: parsed.data.visibility ?? 'private',
    ownerUserId: new mongoose.Types.ObjectId(userId),
  });

  return res.status(201).json({
    id: String(prompt._id),
    title: prompt.title,
    content: prompt.content,
    tags: prompt.tags ?? [],
    visibility: prompt.visibility,
    ownerUserId: String(prompt.ownerUserId),
    upvotes: prompt.upvotes ?? 0,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  });
});

promptsRouter.patch('/prompts/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid prompt id' });

  const parsed = promptSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const prompt = await Prompt.findOneAndUpdate(
    { _id: id, ownerUserId: userId },
    { ...parsed.data },
    { new: true }
  ).exec();
  if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

  return res.json({
    id: String(prompt._id),
    title: prompt.title,
    content: prompt.content,
    tags: prompt.tags ?? [],
    visibility: prompt.visibility,
    ownerUserId: String(prompt.ownerUserId),
    upvotes: prompt.upvotes ?? 0,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  });
});

promptsRouter.delete('/prompts/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid prompt id' });

  const deleted = await Prompt.findOneAndDelete({ _id: id, ownerUserId: userId }).exec();
  if (!deleted) return res.status(404).json({ error: 'Prompt not found' });
  return res.json({ ok: true });
});

