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

export interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  short_name: string;
  description: string;
  hod_name: string;
  hod_email: string;
  labs_count: number;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash?: string | null;
  full_name: string;
  role: 'student' | 'faculty' | 'reviewer' | 'admin';
  department_id: string | null;
  student_roll_number: string | null;
  is_verified: number;
  photo_url?: string | null;
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

export interface ProjectRow {
  id: string;
  submission_type: string;
  owner_user_id?: string | null;
  official_group_id?: string | null;
  title: string;
  summary: string;
  problem_statement?: string | null;
  subject: string;
  project_type: string;
  difficulty: string;
  duration: string;
  language: string;
  equipment: string;
  free_tools_route: string;
  live_demo_url?: string | null;
  repo_url?: string | null;
  documentation_url?: string | null;
  video_url?: string | null;
  presentation_url?: string | null;
  screenshots?: string | null;
  faculty_mentor_name?: string | null;
  faculty_mentor_role?: string | null;
  hardware_evidence?: string | null;
  outcomes: string;
  prerequisites?: string | null;
  tools: string;
  original_authors: string;
  department_id: string;
  academic_year: string;
  licence: string;
  content_owner: string;
  status: string;
  version: string;
  views_count: number;
  shares_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupRow {
  id: string;
  name: string;
  leader_id: string;
  department_id: string;
  academic_year: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  student_roll_number: string;
  invite_status: string;
  joined_at?: string | null;
  created_at: string;
}

export interface RatingRow {
  id: string;
  project_id: string;
  user_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  is_edited: number;
  created_at: string;
  updated_at: string;
}

export interface WishlistRow {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface ViewRow {
  id: string;
  project_id: string;
  viewer_key: string;
  viewed_at: string;
}

export interface ShareRow {
  id: string;
  project_id: string;
  sharer_key: string;
  share_type: string;
  shared_at: string;
}

// Backward-compatible table record count accessor
const getTableCount = (table: string): number => {
  try {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number } | undefined;
    return row?.count ?? 0;
  } catch {
    return 0;
  }
};

export const store = {
  get departments() { return { length: getTableCount('departments') }; },
  get users() { return { length: getTableCount('users') }; },
  get projects() { return { length: getTableCount('projects') }; },
  get official_groups() { return { length: getTableCount('official_groups') }; },
  get official_group_members() { return { length: getTableCount('official_group_members') }; },
  get project_ratings() { return { length: getTableCount('project_ratings') }; },
  get project_comments() { return { length: getTableCount('project_comments') }; },
  get wishlists() { return { length: getTableCount('wishlists') }; },
  get project_views() { return { length: getTableCount('project_views') }; },
  get project_shares() { return { length: getTableCount('project_shares') }; },
};

// Clears all data from every table
export function clearAllData() {
  db.exec('PRAGMA foreign_keys = OFF');
  const tables = [
    'project_shares',
    'project_views',
    'wishlists',
    'project_comments',
    'project_ratings',
    'official_group_members',
    'projects',
    'official_groups',
    'users',
    'departments'
  ];
  for (const table of tables) {
    try {
      db.exec(`DELETE FROM ${table}`);
    } catch {
      // ignore if table does not exist yet
    }
  }
  db.exec('PRAGMA foreign_keys = ON');
  console.log('✓ All database tables successfully cleared.');
}

// Populate sample data helper
export function populateSampleData() {
  // 1. Seed departments if empty
  const deptCount = (db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number }).count;
  if (deptCount === 0) {
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


  // 3. Seed default sample project if projects table is empty
  const projectCount = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
  if (projectCount === 0) {
    const insertProj = db.prepare(`
      INSERT INTO projects (
        id, submission_type, owner_user_id, official_group_id, title, summary,
        problem_statement, subject, project_type, difficulty, duration, language,
        equipment, free_tools_route, live_demo_url, repo_url, documentation_url,
        video_url, presentation_url, screenshots, faculty_mentor_name, faculty_mentor_role,
        hardware_evidence, outcomes, prerequisites, tools, original_authors,
        department_id, academic_year, licence, content_owner, status, version,
        views_count, shares_count, likes_count, created_at, updated_at
      ) VALUES (
        @id, @submission_type, @owner_user_id, @official_group_id, @title, @summary,
        @problem_statement, @subject, @project_type, @difficulty, @duration, @language,
        @equipment, @free_tools_route, @live_demo_url, @repo_url, @documentation_url,
        @video_url, @presentation_url, @screenshots, @faculty_mentor_name, @faculty_mentor_role,
        @hardware_evidence, @outcomes, @prerequisites, @tools, @original_authors,
        @department_id, @academic_year, @licence, @content_owner, @status, @version,
        @views_count, @shares_count, @likes_count, @created_at, @updated_at
      )
    `);

    const now = new Date().toISOString();
    insertProj.run({
      id: 'proj-kits-001',
      submission_type: 'individual',
      owner_user_id: 'usr-student-01',
      official_group_id: null,
      title: 'Smart Grid IoT Microgrid Energy Optimizer',
      summary: 'An intelligent energy management microgrid system designed for campus power distribution, using edge machine learning to dynamically balance solar inverter loads with real-time grid telemetry.',
      problem_statement: 'Engineering campuses face escalating peak-demand electricity tariffs and inefficient renewable solar utilization due to lack of automated phase load balancing across departmental blocks.',
      subject: 'IoT & Smart Grid Systems',
      project_type: 'Major Capstone Project',
      difficulty: 'Advanced',
      duration: '6 Months',
      language: 'English',
      equipment: 'ESP32 Microcontrollers, Current Transformers (CT sensors), Relay Bank, Web Browser',
      free_tools_route: 'Fully achievable with ESPHome, Mosquitto MQTT, Node.js and open-source dashboards',
      live_demo_url: 'https://smartgrid-kits.web.app',
      repo_url: 'https://github.com/kits-college/smart-grid-microgrid',
      documentation_url: 'https://github.com/kits-college/smart-grid-microgrid/blob/main/docs/Report.pdf',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      presentation_url: 'https://slides.google.com/presentation/d/sample-smartgrid',
      screenshots: JSON.stringify(['/kits-hero-bg.jpg']),
      faculty_mentor_name: 'Dr. M. Ravindra Babu',
      faculty_mentor_role: 'Professor & HOD · CSE',
      hardware_evidence: JSON.stringify({ isHardware: true, details: 'ESP32 Wi-Fi Node with SCT-013 CT sensors connected to 3-phase AC distribution board.' }),
      outcomes: JSON.stringify(['28% reduction in peak-hour campus grid consumption', 'Sub-second anomaly alert notification via MQTT', 'Automated phase switching for solar inverter feeds']),
      prerequisites: JSON.stringify(['Basics of Microcontrollers (ESP32 / Arduino)', 'Basic Networking & MQTT Protocol', 'Python or TypeScript for dashboard']),
      tools: JSON.stringify(['IoT', 'Python', 'React', 'Embedded C', 'MQTT', 'TensorFlow Lite']),
      original_authors: JSON.stringify([
        { name: 'A. Rahul', role: 'Team Leader & ML Lead', department: 'CSE', rollNumber: '21B91A0501', contribution: 'Designed edge ML model and MQTT broker architecture' }
      ]),
      department_id: 'cse',
      academic_year: '2026-2027',
      licence: 'MIT Open Source License',
      content_owner: 'A. Rahul',
      status: 'approved',
      version: '1.0.0',
      views_count: 142,
      shares_count: 36,
      likes_count: 28,
      created_at: now,
      updated_at: now
    });
  }
}

// Initial database setup - runs migrations and populates seeds if empty
export function initDatabase() {
  let schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  }

  // Pre-migration checks to add missing columns gracefully
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (tableCheck) {
      const userCols = (db.prepare('PRAGMA table_info(users)').all() as any[]).map((c) => c.name);
      if (!userCols.includes('password_hash')) {
        db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
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
      if (!projCols.includes('views_count')) {
        db.exec('ALTER TABLE projects ADD COLUMN views_count INTEGER DEFAULT 0');
      }
      if (!projCols.includes('shares_count')) {
        db.exec('ALTER TABLE projects ADD COLUMN shares_count INTEGER DEFAULT 0');
      }
    }
  } catch (migErr) {
    console.warn('Pre-migration check note:', migErr);
  }

  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  // Populate sample seeds if database tables are empty
  populateSampleData();
  console.log('✓ SQLite database initialized successfully at', dbPath);
}

export function seedInitialData() {
  initDatabase();
}
