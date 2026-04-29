import { env } from './utils/env.js';
import { createApp } from './app.js';

async function main() {
  const app = createApp();

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

