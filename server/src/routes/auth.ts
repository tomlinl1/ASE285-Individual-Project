import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../utils/env.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
});

const loginSchema = registerSchema;

function signToken(userId: string): string {
  return jwt.sign({}, env.jwtSecret, { subject: userId, expiresIn: '7d' });
}

authRouter.post('/auth/register', authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await User.create({ email, passwordHash });
    const token = signToken(String(user._id));
    return res.status(201).json({ token, user: { id: String(user._id), email: user.email } });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Registration failed';
    if (message.includes('E11000')) return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/auth/login', authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email }).exec();
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signToken(String(user._id));
  return res.json({ token, user: { id: String(user._id), email: user.email } });
});

authRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.userId).select('email').exec();
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  return res.json({ id: String(user._id), email: user.email });
});

