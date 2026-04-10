import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './utils/env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { chatsRouter } from './routes/chats.js';
import { promptsRouter } from './routes/prompts.js';
import { exportRouter } from './routes/export.js';

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

async function main() {
  // Start HTTP server even if DB is down, so /api/health can report status.
  let dbConnected = false;
  try {
    const { connectToMongo } = await import('./db.js');
    await connectToMongo();
    dbConnected = true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection failed:', err);
  }

  app.get('/api/health/db', (_req, res) => {
    res.json({ ok: true, mongoConnected: dbConnected });
  });

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

