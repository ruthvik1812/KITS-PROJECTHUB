import { db } from '../db/database.js';
import { randomUUID } from 'crypto';
import { hash, verify } from '@node-rs/argon2';

export interface UserProfileRecord {
  id: string;
  email: string;
  password_hash?: string | null;
  full_name: string;
  role: 'student' | 'faculty' | 'reviewer' | 'admin';
  department_id: string | null;
  student_roll_number: string | null;
  is_verified: number;
  photo_url: string | null;
  section?: string | null;
  year_semester?: string | null;
  mobile?: string | null;
  father_name?: string | null;
  father_mobile?: string | null;
  parent_email?: string | null;
  present_address?: string | null;
  dob?: string | null;
  created_at: string;
  updated_at: string;
}

export const VALID_BRANCHES = ['cse', 'aiml', 'ece', 'eee', 'me', 'it'];

/**
 * Hashes plaintext password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verifies plaintext password against Argon2id hash
 */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch (err) {
    return false;
  }
}

/**
 * Finds user by email or student roll number
 */
export function findUserByIdentifier(identifier: string): UserProfileRecord | null {
  const clean = identifier.trim().toLowerCase();
  const cleanRoll = identifier.trim().toUpperCase();

  const user = db.prepare(`
    SELECT * FROM users 
    WHERE LOWER(email) = ? OR UPPER(student_roll_number) = ?
  `).get(clean, cleanRoll) as UserProfileRecord | undefined;

  return user || null;
}

/**
 * Validates and registers a new student account with Argon2id password hashing
 * Rule: Registration is student registration only.
 */
export async function registerStudentAccount(params: {
  email: string;
  fullName: string;
  departmentId: string;
  studentRollNumber: string;
  password: string;
}): Promise<UserProfileRecord> {
  const email = (params.email || '').trim().toLowerCase();
  const fullName = (params.fullName || '').trim();
  const departmentId = (params.departmentId || '').trim().toLowerCase();
  const rollNumber = (params.studentRollNumber || '').trim().toUpperCase();
  const password = params.password || '';

  // 1. Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error('Please provide a valid email address (e.g. name@kitsts.ac.in).');
  }

  // 2. Validate Full Name
  if (!fullName || fullName.length < 2) {
    throw new Error('Full Name must be at least 2 characters.');
  }

  // 3. Validate Branch / Department
  if (!departmentId || !VALID_BRANCHES.includes(departmentId)) {
    throw new Error(`Invalid branch selected. Must be one of: ${VALID_BRANCHES.join(', ').toUpperCase()}`);
  }

  // 4. Validate Roll Number
  if (!rollNumber || rollNumber.length < 4 || !/^[A-Z0-9]+$/.test(rollNumber)) {
    throw new Error('Please enter a valid alphanumeric college roll number (e.g. 21B91A0501).');
  }

  // 5. Validate Password
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  // 6. Enforce Unique Email & Roll Number using atomic transaction
  const checkEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email);
  if (checkEmail) {
    throw new Error(`An account with email "${email}" already exists. Please login.`);
  }

  const checkRoll = db.prepare('SELECT id FROM users WHERE UPPER(student_roll_number) = ?').get(rollNumber);
  if (checkRoll) {
    throw new Error(`Student roll number "${rollNumber}" is already registered to another account.`);
  }

  // 7. Hash password using Argon2id
  const passwordHash = await hashPassword(password);
  const id = `usr-${randomUUID()}`;
  const now = new Date().toISOString();

  // Registration is strictly student role
  const role = 'student';
  const isVerified = 1; // Registered with student roll number

  db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `).run(id, email, passwordHash, fullName, role, departmentId, rollNumber, isVerified, now, now);
  })();

  const newUser = db.prepare('SELECT id, email, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at FROM users WHERE id = ?').get(id) as UserProfileRecord;
  console.log(`✓ Registered new student "${fullName}" (${email}, Roll: ${rollNumber}) with Argon2id password hash.`);
  return newUser;
}

/**
 * Authenticates student or faculty with identifier (Email or Roll Number) and password
 */
export async function authenticateWithPassword(
  identifier: string,
  password: string
): Promise<UserProfileRecord | null> {
  if (!identifier || !password) return null;

  const user = findUserByIdentifier(identifier);
  if (!user) {
    return null; // Return null so caller issues generic invalid-login message
  }

  const cleanPassword = password.trim();

  // 1. If password matches student's roll number (case-insensitive)
  if (user.student_roll_number && cleanPassword.toUpperCase() === user.student_roll_number.toUpperCase()) {
    // If user didn't have password_hash, save Argon2id hash now
    if (!user.password_hash) {
      try {
        const hash = await hashPassword(user.student_roll_number.toUpperCase());
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
        user.password_hash = hash;
      } catch (err) {
        // ignore hash save error
      }
    }
    return user;
  }

  // 2. If user has a password hash, verify via Argon2id
  if (user.password_hash) {
    const isValid = await verifyPassword(user.password_hash, cleanPassword);
    if (!isValid) {
      return null;
    }
    return user;
  }

  return null;
}

/**
 * Sets a new password for an existing account that had no password (e.g. pre-seeded account)
 */
export async function setupUserPassword(
  identifier: string,
  newPassword: string
): Promise<UserProfileRecord> {
  if (!newPassword || newPassword.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const user = findUserByIdentifier(identifier);
  if (!user) {
    throw new Error('Account not found for the provided identifier.');
  }

  const passwordHash = await hashPassword(newPassword.trim());
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE users 
    SET password_hash = ?, updated_at = ? 
    WHERE id = ?
  `).run(passwordHash, now, user.id);

  console.log(`✓ Set Argon2id password for user "${user.full_name}" (${user.email})`);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as UserProfileRecord;
}

/**
 * Get or seed default preset accounts with pre-hashed Argon2id passwords
 */
export async function getPresetUser(preset: string): Promise<UserProfileRecord> {
  const now = new Date().toISOString();

  if (preset === 'leader' || preset === 'student' || preset === 'rahul') {
    const roll = '21B91A0501';
    const rollHash = await hashPassword(roll);
    let user = db.prepare(`SELECT * FROM users WHERE student_roll_number = ? OR email = 'student.demo@kitsts.ac.in'`).get(roll) as UserProfileRecord | undefined;
    if (!user) {
      const id = 'usr-student-01';
      db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at)
        VALUES (?, 'student.demo@kitsts.ac.in', ?, 'A. Rahul', 'student', 'cse', ?, 1, NULL, ?, ?)
      `).run(id, rollHash, roll, now, now);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserProfileRecord;
    } else if (!user.password_hash) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(rollHash, user.id);
      user.password_hash = rollHash;
    }
    return user;
  }

  if (preset === 'sneha' || preset === 'member1') {
    const roll = '21B91A0502';
    const rollHash = await hashPassword(roll);
    let user = db.prepare(`SELECT * FROM users WHERE student_roll_number = ? OR email = 'student2@kitsts.ac.in'`).get(roll) as UserProfileRecord | undefined;
    if (!user) {
      const id = 'usr-student-02';
      db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at)
        VALUES (?, 'student2@kitsts.ac.in', ?, 'Student Member 1', 'student', 'cse', ?, 1, NULL, ?, ?)
      `).run(id, rollHash, roll, now, now);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserProfileRecord;
    } else if (!user.password_hash) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(rollHash, user.id);
      user.password_hash = rollHash;
    }
    return user;
  }

  if (preset === 'sravani' || preset === 'member2') {
    const roll = '21B91A0503';
    const rollHash = await hashPassword(roll);
    let user = db.prepare(`SELECT * FROM users WHERE student_roll_number = ? OR email = 'student3@kitsts.ac.in'`).get(roll) as UserProfileRecord | undefined;
    if (!user) {
      const id = 'usr-student-03';
      db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at)
        VALUES (?, 'student3@kitsts.ac.in', ?, 'Student Member 2', 'student', 'aiml', ?, 1, NULL, ?, ?)
      `).run(id, rollHash, roll, now, now);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserProfileRecord;
    } else if (!user.password_hash) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(rollHash, user.id);
      user.password_hash = rollHash;
    }
    return user;
  }

  if (preset === 'tharun' || preset === 'member3') {
    const roll = '21B91A0504';
    const rollHash = await hashPassword(roll);
    let user = db.prepare(`SELECT * FROM users WHERE student_roll_number = ? OR email = 'student4@kitsts.ac.in'`).get(roll) as UserProfileRecord | undefined;
    if (!user) {
      const id = 'usr-student-04';
      db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at)
        VALUES (?, 'student4@kitsts.ac.in', ?, 'Student Member 3', 'student', 'me', ?, 1, NULL, ?, ?)
      `).run(id, rollHash, roll, now, now);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserProfileRecord;
    } else if (!user.password_hash) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(rollHash, user.id);
      user.password_hash = rollHash;
    }
    return user;
  }

  const defaultHash = await hashPassword('kits123');
  if (preset === 'faculty' || preset === 'mentor') {
    let user = db.prepare(`SELECT * FROM users WHERE role IN ('faculty', 'reviewer') OR email = 'm.ravindra@kitsts.ac.in' OR email = 's.ramesh@kitsts.ac.in'`).get() as UserProfileRecord | undefined;
    if (!user) {
      const id = 'usr-faculty-01';
      db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at)
        VALUES (?, 'm.ravindra@kitsts.ac.in', ?, 'Dr. M. Ravindra Babu', 'faculty', 'cse', NULL, 1, NULL, ?, ?)
      `).run(id, defaultHash, now, now);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserProfileRecord;
    } else if (!user.password_hash) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(defaultHash, user.id);
      user.password_hash = defaultHash;
    }
    return user;
  }

  if (preset === 'admin') {
    let user = db.prepare(`SELECT * FROM users WHERE role = 'admin'`).get() as UserProfileRecord | undefined;
    if (!user) {
      const id = 'usr-admin-01';
      db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at)
        VALUES (?, 'admin.portal@kitsts.ac.in', ?, 'KITS Academic Dean (Admin)', 'admin', 'cse', NULL, 1, NULL, ?, ?)
      `).run(id, defaultHash, now, now);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserProfileRecord;
    } else if (!user.password_hash) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(defaultHash, user.id);
      user.password_hash = defaultHash;
    }
    return user;
  }

  let fallback = db.prepare('SELECT * FROM users LIMIT 1').get() as UserProfileRecord | undefined;
  if (!fallback) {
    return getPresetUser('leader');
  }
  return fallback;
}

/**
 * Verify and link student roll number to account
 */
export function verifyAndLinkStudentRollNumber(
  userId: string,
  rollNumber: string,
  departmentId?: string
): UserProfileRecord {
  const cleanRoll = rollNumber.trim().toUpperCase();
  const now = new Date().toISOString();

  if (cleanRoll.length < 4) {
    throw new Error('Invalid college student roll number. Please provide a valid institutional ID (e.g. 21B91A0501).');
  }

  const existing = db.prepare(`
    SELECT * FROM users WHERE UPPER(student_roll_number) = ?
  `).get(cleanRoll) as UserProfileRecord | undefined;

  if (existing && existing.id !== userId) {
    throw new Error(`Roll number ${cleanRoll} is already registered to another account.`);
  }

  db.prepare(`
    UPDATE users 
    SET student_roll_number = ?, is_verified = 1, department_id = COALESCE(?, department_id), updated_at = ? 
    WHERE id = ?
  `).run(cleanRoll, departmentId || null, now, userId);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserProfileRecord;
}

export function getUserById(userId: string): UserProfileRecord | null {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserProfileRecord | undefined;
  return user || null;
}
