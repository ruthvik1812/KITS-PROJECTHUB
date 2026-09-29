import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for SQLite file
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'kits_projecthub.db');
export const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for high concurrency & Foreign Keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDatabase() {
  let schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  }
  // Run column migrations first on existing tables before running full schema & indices
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (tableCheck) {
      const userCols = (db.prepare('PRAGMA table_info(users)').all() as any[]).map((c) => c.name);
      if (!userCols.includes('password_hash')) {
        db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
        console.log('✓ Added password_hash column to users table');
      }
      if (!userCols.includes('section')) {
        db.exec("ALTER TABLE users ADD COLUMN section TEXT DEFAULT 'CSE-B'");
      }
      if (!userCols.includes('year_semester')) {
        db.exec("ALTER TABLE users ADD COLUMN year_semester TEXT DEFAULT 'IV Year I Semester'");
      }
      if (!userCols.includes('mobile')) {
        db.exec('ALTER TABLE users ADD COLUMN mobile TEXT');
      }
      if (!userCols.includes('father_name')) {
        db.exec('ALTER TABLE users ADD COLUMN father_name TEXT');
      }
      if (!userCols.includes('father_mobile')) {
        db.exec('ALTER TABLE users ADD COLUMN father_mobile TEXT');
      }
      if (!userCols.includes('parent_email')) {
        db.exec('ALTER TABLE users ADD COLUMN parent_email TEXT');
      }
      if (!userCols.includes('present_address')) {
        db.exec('ALTER TABLE users ADD COLUMN present_address TEXT');
      }
      if (!userCols.includes('dob')) {
        db.exec("ALTER TABLE users ADD COLUMN dob TEXT DEFAULT '0000-00-00'");
      }
    }

    const projCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get();
    if (projCheck) {
      const projCols = (db.prepare('PRAGMA table_info(projects)').all() as any[]).map((c) => c.name);
      if (!projCols.includes('documentation_url')) {
        db.exec('ALTER TABLE projects ADD COLUMN documentation_url TEXT');
      }
      if (!projCols.includes('faculty_mentor_name')) {
        db.exec('ALTER TABLE projects ADD COLUMN faculty_mentor_name TEXT');
      }
      if (!projCols.includes('faculty_mentor_role')) {
        db.exec('ALTER TABLE projects ADD COLUMN faculty_mentor_role TEXT');
      }
      if (!projCols.includes('project_type')) {
        db.exec("ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'Major Capstone Project'");
      }
      if (!projCols.includes('submission_type')) {
        db.exec("ALTER TABLE projects ADD COLUMN submission_type TEXT DEFAULT 'group'");
      }
      if (!projCols.includes('owner_user_id')) {
        db.exec('ALTER TABLE projects ADD COLUMN owner_user_id TEXT');
      }
      if (!projCols.includes('problem_statement')) {
        db.exec('ALTER TABLE projects ADD COLUMN problem_statement TEXT');
      }
      if (!projCols.includes('video_url')) {
        db.exec('ALTER TABLE projects ADD COLUMN video_url TEXT');
      }
      if (!projCols.includes('presentation_url')) {
        db.exec('ALTER TABLE projects ADD COLUMN presentation_url TEXT');
      }
      if (!projCols.includes('screenshots')) {
        db.exec('ALTER TABLE projects ADD COLUMN screenshots TEXT');
      }
    }
    // --- Comments & Ratings tables ---
    db.exec(`
      CREATE TABLE IF NOT EXISTS project_ratings (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(project_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_ratings_project ON project_ratings(project_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_user ON project_ratings(user_id);

      CREATE TABLE IF NOT EXISTS project_comments (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_edited INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_comments_project ON project_comments(project_id);
      CREATE INDEX IF NOT EXISTS idx_comments_user ON project_comments(user_id);
    `);
  } catch (migErr) {
    console.warn('Pre-migration check note:', migErr);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Set default submission_type for existing projects
  db.prepare(`
    UPDATE projects 
    SET submission_type = 'group' 
    WHERE submission_type IS NULL OR submission_type = ''
  `).run();

  // Populate sample mentor for existing group projects if empty
  db.prepare(`
    UPDATE projects 
    SET faculty_mentor_name = 'Dr. M. Ravindra Babu', faculty_mentor_role = 'Professor & HOD · CSE'
    WHERE (faculty_mentor_name IS NULL OR faculty_mentor_name = '') AND submission_type = 'group'
  `).run();

  // Ensure individual projects do not have assigned faculty mentor
  db.prepare(`
    UPDATE projects 
    SET faculty_mentor_name = NULL, faculty_mentor_role = NULL
    WHERE submission_type = 'individual'
  `).run();

  // Migrate legacy academic_years to batch 2027 to 2031 range
  try {
    db.prepare(`
      UPDATE projects 
      SET academic_year = '2026-2027' 
      WHERE academic_year IN ('2024-2025', '2023-2024', '2025-2026', '2022-2023')
    `).run();

    db.prepare(`
      UPDATE official_groups 
      SET academic_year = '2026-2027' 
      WHERE academic_year IN ('2024-2025', '2023-2024', '2025-2026', '2022-2023')
    `).run();
  } catch (e) {
    // ignore
  }

  seedInitialData();
  console.log('✓ SQLite database initialized successfully at', dbPath);
}

function seedInitialData() {
  // 1. Seed departments if empty
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
  if (deptCount.count === 0) {
    const insertDept = db.prepare(`
      INSERT INTO departments (id, code, name, short_name, description, hod_name, hod_email, labs_count)
      VALUES (@id, @code, @name, @short_name, @description, @hod_name, @hod_email, @labs_count)
    `);

    const depts = [
      { id: 'aiml', code: 'CSM', name: 'Artificial Intelligence and Machine Learning', short_name: 'AI & ML', description: 'Deep learning, neural vision, and intelligent cyber-physical systems.', hod_name: 'Dr. S. Ramesh Kumar', hod_email: 's.ramesh@kitsts.ac.in', labs_count: 5 },
      { id: 'cse', code: 'CSE', name: 'Computer Science and Engineering', short_name: 'CSE', description: 'Core computing, distributed algorithms, systems engineering and cloud systems.', hod_name: 'Dr. P. Niranjan', hod_email: 'p.niranjan@kitsts.ac.in', labs_count: 7 },
      { id: 'ece', code: 'ECE', name: 'Electronics and Communication Engineering', short_name: 'ECE', description: 'Embedded IoT, microelectronics, RF systems and DSP lab.', hod_name: 'Dr. B. Rama Devi', hod_email: 'b.ramadevi@kitsts.ac.in', labs_count: 6 },
      { id: 'eee', code: 'EEE', name: 'Electrical and Electronics Engineering', short_name: 'EEE', description: 'Renewable energy microgrids, EV powertrains and high-voltage simulation.', hod_name: 'Dr. C. Venkatesh', hod_email: 'c.venkatesh@kitsts.ac.in', labs_count: 4 },
      { id: 'me', code: 'ME', name: 'Mechanical Engineering', short_name: 'ME', description: 'Robotics chassis, additive manufacturing, thermofluids and CAD/CAM.', hod_name: 'Dr. K. Sridhar', hod_email: 'k.sridhar@kitsts.ac.in', labs_count: 6 },
      { id: 'it', code: 'IT', name: 'Information Technology', short_name: 'IT', description: 'Cybersecurity, fullstack engineering, database systems and mobile networks.', hod_name: 'Dr. T. Senthil Murugan', hod_email: 't.senthil@kitsts.ac.in', labs_count: 4 }
    ];

    const insertMany = db.transaction((rows: typeof depts) => {
      for (const row of rows) insertDept.run(row);
    });
    insertMany(depts);
  }

  // 2. Seed default users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, full_name, role, department_id, student_roll_number, is_verified, section, year_semester, mobile, father_name, father_mobile, parent_email, present_address, dob, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertUser.run('usr-student-01', 'student.demo@kitsts.ac.in', 'A. Rahul', 'student', 'cse', '21B91A0501', 1, 'CSE-A', 'IV Year I Semester', '9876543201', 'Sample Parent', '9876543200', 'parent.sample@example.com', 'KITS Campus, Singapur, Huzurabad', '2003-01-01', now, now);
    insertUser.run('usr-student-02', 'student2@kitsts.ac.in', 'Student Member 1', 'student', 'aiml', '21B91A0502', 1, 'CSM-A', 'IV Year I Semester', '9876543202', '', '', '', 'KITS Campus', '2003-05-12', now, now);
    insertUser.run('usr-student-03', 'student3@kitsts.ac.in', 'Student Member 2', 'student', 'me', '21B91A0503', 1, 'ME-A', 'IV Year I Semester', '9876543203', '', '', '', 'KITS Campus', '2003-08-20', now, now);
    insertUser.run('usr-student-04', 'student4@kitsts.ac.in', 'Student Member 3', 'student', 'cse', '21B91A0504', 1, 'CSE-A', 'IV Year I Semester', '9876543204', '', '', '', 'KITS Campus', '2003-11-15', now, now);
    insertUser.run('usr-faculty-01', 's.ramesh@kitsts.ac.in', 'Dr. S. Ramesh Kumar', 'reviewer', 'aiml', null, 1, 'Faculty', 'Professor', '9876543213', '', '', '', 'KITS Campus', '1980-01-01', now, now);
    insertUser.run('usr-admin-01', 'admin.portal@kitsts.ac.in', 'KITS Academic Dean (Admin)', 'admin', 'cse', null, 1, 'Admin', 'Dean', '9876543214', '', '', '', 'KITS Campus', '1975-01-01', now, now);
  } else {
    // Sanitize any user records containing personal data
    try {
      db.prepare(`
        UPDATE users 
        SET full_name = 'A. Rahul',
            email = 'student.demo@kitsts.ac.in',
            student_roll_number = '21B91A0501',
            section = 'CSE-A',
            year_semester = 'IV Year I Semester',
            mobile = '9876543201',
            father_name = 'Sample Parent',
            father_mobile = '9876543200',
            parent_email = 'parent.sample@example.com',
            present_address = 'KITS Campus, Singapur, Huzurabad',
            dob = '2003-01-01'
        WHERE id = 'usr-student-01' OR student_roll_number = '23281A0579'
      `).run();

      db.prepare(`
        UPDATE users 
        SET full_name = 'Student Member 1',
            email = 'student2@kitsts.ac.in',
            student_roll_number = '21B91A0502'
        WHERE id = 'usr-student-02'
      `).run();

      db.prepare(`
        UPDATE users 
        SET full_name = 'Student Member 2',
            email = 'student3@kitsts.ac.in',
            student_roll_number = '21B91A0503'
        WHERE id = 'usr-student-03'
      `).run();

      db.prepare(`
        UPDATE users 
        SET full_name = 'Student Member 3',
            email = 'student4@kitsts.ac.in',
            student_roll_number = '21B91A0504'
        WHERE id = 'usr-student-04'
      `).run();
    } catch {}
  }

  console.log('✓ Initial SQL database records initialized for departments and users.');
}


