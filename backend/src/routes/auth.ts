import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  registerStudentAccount,
  authenticateWithPassword,
  setupUserPassword,
  findUserByIdentifier,
  getPresetUser,
  verifyAndLinkStudentRollNumber,
  getUserById,
  UserProfileRecord,
} from '../services/userService.js';
import { getGroupByUserId } from '../services/groupSqlService.js';
import { db } from '../db/database.js';

const router = Router();

// In-memory rate limiting map for authentication attempts
interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute
const LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes lockout after exceeding max attempts

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    return { allowed: true };
  }

  if (entry.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  if (now - entry.firstAttemptAt > WINDOW_MS) {
    rateLimitMap.delete(key);
    return { allowed: true };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + LOCKOUT_MS;
    return { allowed: false, retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }

  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    rateLimitMap.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    });
  } else {
    entry.attempts += 1;
  }
}

function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

function formatUserResponse(user: UserProfileRecord) {
  const group = getGroupByUserId(user.id, user.student_roll_number || undefined);
  let departmentName = '';
  let departmentCode = '';
  if (user.department_id) {
    const dept = db.prepare('SELECT name, code FROM departments WHERE id = ?').get(user.department_id) as any;
    if (dept?.name) departmentName = dept.name;
    if (dept?.code) departmentCode = dept.code;
  }

  return {
    uid: user.id,
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    name: user.full_name,
    role: user.role,
    departmentId: user.department_id || 'cse',
    departmentCode: departmentCode || (user.department_id ? user.department_id.toUpperCase() : 'CSE'),
    departmentName,
    studentRollNumber: user.student_roll_number,
    isVerified: Boolean(user.is_verified),
    photoUrl: user.photo_url,
    photoURL: user.photo_url,
    section: user.section || 'CSE-B',
    yearSemester: user.year_semester || 'IV Year I Semester',
    mobile: user.mobile || '8639139326',
    fatherName: user.father_name || '',
    fatherMobile: user.father_mobile || '',
    parentEmail: user.parent_email || '',
    presentAddress: user.present_address || '#17-3/1,mamindlawada,huzurabad',
    dob: user.dob || '0000-00-00',
    group: group || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * POST /api/auth/register
 * Student Registration only with: Email, Full Name, Branch, Roll Number, Password (Argon2id)
 */
router.post('/register', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(`reg_${ip}`);
  if (!rateLimit.allowed) {
    res.status(429).json({
      error: `Too many registration attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
    });
    return;
  }

  const { email, fullName, branch, departmentId, rollNumber, studentRollNumber, password } = req.body;

  try {
    const user = await registerStudentAccount({
      email,
      fullName,
      departmentId: branch || departmentId,
      studentRollNumber: rollNumber || studentRollNumber,
      password,
    });

    resetRateLimit(`reg_${ip}`);

    // Establish authenticated session with session rotation
    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error('Session regeneration error on registration:', regenErr);
      }
      (req.session as any).userId = user.id;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error on registration:', saveErr);
          res.status(500).json({ error: 'Could not save session.' });
          return;
        }
        res.status(201).json({
          message: 'Account created and signed in successfully.',
          user: formatUserResponse(user),
        });
      });
    });
  } catch (err: any) {
    recordFailedAttempt(`reg_${ip}`);
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

/**
 * POST /api/auth/login
 * Email-and-Password Login with Argon2id verification and generic invalid-login message
 */
router.post('/login', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { email, identifier, password } = req.body;
  const loginId = (email || identifier || '').trim();

  if (!loginId || !password) {
    res.status(400).json({ error: 'Please provide both email and password.' });
    return;
  }

  const rateLimitKey = `login_${ip}_${loginId.toLowerCase()}`;
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    res.status(429).json({
      error: `Too many failed login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
    });
    return;
  }

  try {
    const user = await authenticateWithPassword(loginId, password);

    if (!user) {
      recordFailedAttempt(rateLimitKey);
      // Generic invalid login message to prevent user enumeration
      res.status(401).json({
        error: 'Invalid email or password.',
        code: 'auth/invalid-credentials',
      });
      return;
    }

    resetRateLimit(rateLimitKey);

    // Rotate session ID on successful login (Session Fixation Protection)
    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error('Session regeneration error on login:', regenErr);
      }
      (req.session as any).userId = user.id;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error on login:', saveErr);
          res.status(500).json({ error: 'Could not establish login session.' });
          return;
        }
        console.log(`✓ User "${user.full_name}" (${user.email}) signed in successfully.`);
        res.json({
          message: 'Login successful.',
          user: formatUserResponse(user),
        });
      });
    });
  } catch (err: any) {
    console.error('Login error:', err);
    recordFailedAttempt(rateLimitKey);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});

/**
 * POST /api/auth/setup-password
 * Allows setting an initial Argon2id password for an existing account
 */
router.post('/setup-password', async (req: Request, res: Response) => {
  const { identifier, newPassword } = req.body;

  if (!identifier || !newPassword) {
    res.status(400).json({ error: 'Identifier and new password are required.' });
    return;
  }

  try {
    const user = await setupUserPassword(identifier, newPassword);
    res.json({
      message: 'Password set successfully. You can now login with your new password.',
      user: formatUserResponse(user),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to setup password.' });
  }
});

/**
 * POST /api/auth/quick-login
 * Dev/Preset Login helper for seeded test accounts
 */
router.post(['/quick-login', '/dev-login'], async (req: Request, res: Response) => {
  const { preset } = req.body;

  try {
    const user = await getPresetUser(preset || 'leader');

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error('Session regen error:', regenErr);
      }
      (req.session as any).userId = user.id;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          res.status(500).json({ error: 'Could not save session.' });
          return;
        }
        console.log(`✓ Quick login as "${user.full_name}" (${user.role})`);
        res.json({
          message: `Signed in as ${user.full_name}`,
          user: formatUserResponse(user),
        });
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Quick login failed.' });
  }
});

/**
 * GET /api/auth/me
 * Returns authenticated user profile from active session
 */
router.get('/me', (req: Request, res: Response) => {
  const session = req.session as any;

  if (!session || !session.userId) {
    res.json(null);
    return;
  }

  try {
    const user = getUserById(session.userId);
    if (!user) {
      session.destroy(() => { });
      res.json(null);
      return;
    }

    res.json(formatUserResponse(user));
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

/**
 * POST /api/auth/verify-roll
 * Links official college student roll number
 */
router.post('/verify-roll', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentRollNumber, departmentId } = req.body;

    if (!studentRollNumber || !studentRollNumber.trim()) {
      res.status(400).json({ error: 'Student roll number is required (e.g. 21B91A0501).' });
      return;
    }

    const updated = verifyAndLinkStudentRollNumber(user.id, studentRollNumber.trim(), departmentId);

    res.json({
      message: 'College student roll number verified and linked successfully.',
      user: formatUserResponse(updated),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Verification failed.' });
  }
});

/**
 * POST /api/auth/logout
 * Destroys server-side session and clears HttpOnly session cookie
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout session destruction error:', err);
    }
    res.clearCookie('kits_session', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

export default router;
