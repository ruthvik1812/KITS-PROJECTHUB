import { Request, Response, NextFunction } from 'express';
import { UserProfileRecord } from '../services/userService.js';

export type AllowedRole = 'student' | 'faculty' | 'reviewer' | 'admin';

/**
 * Middleware factory that checks the authenticated user's role against a list
 * of allowed roles. Must be used after the `authenticate` middleware.
 *
 * Usage: router.post('/reviews', authenticate, authorize('faculty', 'admin'), handler);
 */
export function authorize(...allowedRoles: AllowedRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as UserProfileRecord | undefined;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(user.role as AllowedRole)) {
      res.status(403).json({
        error: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Checks that the authenticated user has verified college membership (roll number linked or faculty/admin).
 */
export function requireApprovedMembership(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as any).user as UserProfileRecord | undefined;

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const isApproved =
    Boolean(user.is_verified) ||
    user.role === 'admin' ||
    user.role === 'faculty' ||
    user.role === 'reviewer';

  if (!isApproved) {
    res.status(403).json({
      error: 'College student roll number verification required to perform this action.',
    });
    return;
  }

  next();
}
