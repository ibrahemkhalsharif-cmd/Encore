import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { fail } from './errors';

const COOKIE = 'encore_session';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Sets the browser cookie and also returns the token so API clients
// that can't use cookies (the mobile app) can store it themselves.
export function issueSession(res: Response, userId: number): string {
  const token = jwt.sign({ sub: String(userId) }, config.jwtSecret, {
    expiresIn: '7d',
  });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: WEEK_MS,
  });
  return token;
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE);
}

function userIdFromRequest(req: Request): number | null {
  const header = req.get('authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearer ?? req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === 'object' && payload.sub) {
      return Number(payload.sub);
    }
  } catch {
    // expired or tampered token, treat as signed out
  }
  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const userId = userIdFromRequest(req);
  if (!userId) return fail(401, 'You need to sign in first');
  req.userId = userId;
  next();
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}
