import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './utils/env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { chatsRouter } from './routes/chats.js';
import { promptsRouter } from './routes/prompts.js';
import { exportRouter } from './routes/export.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    })
  );

  app.use('/api', healthRouter);
  app.use('/api', authRouter);
  app.use('/api', chatsRouter);
  app.use('/api', promptsRouter);
  app.use('/api', exportRouter);

  return app;
}

