import { Request, Response, NextFunction } from 'express';

const SENSITIVE_PATTERNS = [
  /sqlite/i,
  /sql/i,
  /pragma/i,
  /syntax error/i,
  /no such (table|column|index)/i,
  /constraint failed/i,
  /foreign key/i,
  /database is locked/i,
  /disk i\/o/i,
  /enoent/i,
  /eacces/i,
  /eexist/i,
  /eisdir/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /node_modules/i,
  /webpack/i,
  /vite/i,
  /(\/|\\)[a-zA-Z0-9_.-]+(\/|\\)/, // directory paths
  /([A-Za-z]:[\\/])/i,              // Windows drive letters like C:\ or E:/
  /(\/home|\/Users|\/var|\/tmp|\/etc)/i, // Unix system paths
  /\.(ts|js|json|sql|db|lock|mjs|cjs):[0-9]+/i, // File line numbers like server.ts:42
  /^\s*at\s+/m,                     // Stack trace lines
  /typeerror/i,
  /referenceerror/i,
  /rangeerror/i,
  /syntaxerror/i,
  /evalerror/i,
  /urierror/i,
  /cannot read propert/i,
  /is not a function/i,
  /is not defined/i,
  /call stack/i,
  /stack trace/i,
  /uncaught/i,
  /unhandled/i,
  /query failed/i,
  /failed with status/i,
  /internal error/i,
  /argon2/i,
  /password_hash/i,
  /secret/i,
  /token/i,
];

/**
 * Checks whether an error message contains internal system implementation details,
 * database errors, filesystem paths, or stack traces.
 */
export function isSensitiveError(message: string): boolean {
  if (!message || typeof message !== 'string') return true;
  if (message.length > 300) return true; // Unusually long strings are typically dumps

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }
  return false;
}

/**
 * Sanitizes client error messages. If the error contains sensitive or internal
 * details, logs the original error server-side and returns a safe, clean fallback.
 */
export function sanitizeClientErrorMessage(err: any, fallbackMessage: string): string {
  const rawMessage = err?.message;
  if (!rawMessage || typeof rawMessage !== 'string' || isSensitiveError(rawMessage)) {
    console.error('[Internal Error Sanitized]:', err);
    return fallbackMessage;
  }
  return rawMessage.trim();
}

/**
 * Centralized Express 4-argument global error handling middleware.
 * Ensures that no raw errors, stack traces, or file paths ever leak to clients in production or development.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  // 1. JSON parsing syntax error from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Invalid JSON payload received. Please check request formatting.',
    });
    return;
  }

  // 2. CORS origin rejection
  if (err?.message && typeof err.message === 'string' && err.message.startsWith('CORS:')) {
    res.status(403).json({
      error: 'Cross-origin request not allowed.',
    });
    return;
  }

  // 3. Log unexpected server errors internally
  console.error('[Unhandled Application Error]:', err);

  // 4. Clean human-readable response without internal leakage
  const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) {
    res.status(status).json({
      error: 'An unexpected internal error occurred. Please try again later.',
    });
    return;
  }

  const safeMessage = sanitizeClientErrorMessage(err, 'The request could not be processed.');
  res.status(status).json({ error: safeMessage });
}
