import cookieParser from 'cookie-parser';
import express from 'express';
import { ZodError } from 'zod';
import { config } from './config';
import { pool } from './db';
import { ApiError } from './errors';
import { authRouter } from './routes/auth';
import { eventsRouter } from './routes/events';
import { hostRouter } from './routes/host';
import { ordersRouter } from './routes/orders';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/host', hostRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message ?? 'Invalid input' });
    }
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our end' });
  }
);

// The dev database boots alongside the server, so give it a moment.
async function waitForDb(attempts = 60) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query('select 1');
      return;
    } catch {
      if (i === attempts) throw new Error('Could not reach the database');
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

waitForDb().then(() => {
  app.listen(config.port, () => {
    console.log(`api listening on http://localhost:${config.port}`);
  });
});
