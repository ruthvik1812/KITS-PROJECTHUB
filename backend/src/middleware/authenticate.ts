import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import { UserProfileRecord } from '../services/userService.js';

export interface AuthenticatedRequest extends Request {
  user: UserProfileRecord;
}

/**
 * Express middleware that enforces active server-side session authentication.
 *
 * Rules:
 * 1. Checks persistent HttpOnly session cookie (req.session.userId).
 * 2. Rejects missing or expired sessions with 401 Unauthorized.
 * 3. Derives user identity strictly from the verified session, NEVER from client-supplied IDs.
 * 4. Attaches verified user to `req.user` for downstream handlers.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const session = req.session as any;

  if (!session || !session.userId) {
    res.status(401).json({
      error: 'Authentication required. No active session found. Please sign in.',
      code: 'auth/session-required',
    });
    return;
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.userId) as UserProfileRecord | undefined;

  if (!user) {
    // Session refers to a user that no longer exists in the database
    req.session.destroy(() => {});
    res.status(401).json({
      error: 'User session is invalid or has expired. Please sign in again.',
      code: 'auth/user-not-found',
    });
    return;
  }

  (req as any).user = user;
  next();
}
