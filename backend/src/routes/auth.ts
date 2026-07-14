import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { clearSession, issueSession, requireAuth } from '../auth';
import { query } from '../db';
import { fail } from '../errors';

export const authRouter = Router();

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registration = credentials.extend({
  name: z.string().trim().min(1, 'Name is required').max(80),
});

authRouter.post('/register', async (req, res) => {
  const { name, email, password } = registration.parse(req.body);

  const existing = await query('select 1 from users where email = $1', [email]);
  if (existing.rowCount) fail(409, 'An account with that email already exists');

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query<{ id: number; name: string; email: string }>(
    `insert into users (name, email, password_hash)
     values ($1, $2, $3)
     returning id, name, email`,
    [name, email, hash]
  );

  const token = issueSession(res, rows[0].id);
  res.status(201).json({ user: rows[0], token });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = credentials.parse(req.body);

  const { rows } = await query<{
    id: number;
    name: string;
    email: string;
    password_hash: string;
  }>('select id, name, email, password_hash from users where email = $1', [
    email,
  ]);

  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) fail(401, 'Wrong email or password');

  const token = issueSession(res, user.id);
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query(
    'select id, name, email from users where id = $1',
    [req.userId]
  );
  if (!rows[0]) fail(401, 'Account no longer exists');
  res.json({ user: rows[0] });
});
