-- KITS ProjectHub — Relational SQL Database Schema (SQLite / SQL)
-- Implements specifications from KITS_ProjectHub_Learning_Platform_Spec.md

PRAGMA foreign_keys = ON;

-- 1. Academic Departments
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    description TEXT,
    hod_name TEXT,
    hod_email TEXT,
    labs_count INTEGER DEFAULT 0
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'reviewer', 'admin')),
    department_id TEXT REFERENCES departments(id),
    student_roll_number TEXT UNIQUE, -- College roll number (e.g. 21B91A0501 or 23281A0579)
    is_verified INTEGER DEFAULT 0,
    photo_url TEXT,
    section TEXT DEFAULT 'CSE-B',
    year_semester TEXT DEFAULT 'IV Year I Semester',
    mobile TEXT,
    father_name TEXT,
    father_mobile TEXT,
    parent_email TEXT,
    present_address TEXT,
    dob TEXT DEFAULT '0000-00-00',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_roll ON users(student_roll_number);

-- 3. Official Groups (Mandatory rule: 4-6 distinct confirmed students, 1 group per student)
CREATE TABLE IF NOT EXISTS official_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    leader_id TEXT NOT NULL REFERENCES users(id),
    department_id TEXT REFERENCES departments(id),
    academic_year TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('forming', 'confirmed', 'frozen', 'archived')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 4. Official Group Members (Atomic rule: 1 official group per verified student)
CREATE TABLE IF NOT EXISTS official_group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES official_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id), -- Enforces 1 group per student
    student_roll_number TEXT NOT NULL,
    invite_status TEXT NOT NULL CHECK (invite_status IN ('pending', 'accepted', 'rejected')),
    joined_at TEXT,
    created_at TEXT NOT NULL
);

-- 5. Projects (Public catalog, individual & student capstone records)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    submission_type TEXT NOT NULL DEFAULT 'group' CHECK (submission_type IN ('individual', 'group')),
    owner_user_id TEXT REFERENCES users(id),
    official_group_id TEXT REFERENCES official_groups(id),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    problem_statement TEXT,
    subject TEXT NOT NULL,
    project_type TEXT DEFAULT 'Major Capstone Project',
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    duration TEXT NOT NULL,
    language TEXT DEFAULT 'English',
    equipment TEXT DEFAULT 'Standard PC / Web Browser',
    free_tools_route TEXT DEFAULT 'Fully achievable with free/open-source tools',
    live_demo_url TEXT,
    repo_url TEXT,
    documentation_url TEXT,
    video_url TEXT,
    presentation_url TEXT,
    screenshots TEXT, -- JSON array of screenshot URLs
    faculty_mentor_name TEXT,
    faculty_mentor_role TEXT,
    hardware_evidence TEXT,
    outcomes TEXT NOT NULL, -- JSON array of observable outcomes
    prerequisites TEXT, -- JSON array of recommended prerequisites
    tools TEXT, -- JSON array of tools
    original_authors TEXT NOT NULL, -- JSON array of {name, role, department, contribution, rollNumber}
    department_id TEXT REFERENCES departments(id),
    academic_year TEXT NOT NULL,
    licence TEXT DEFAULT 'CC BY-NC 4.0 / MIT Open Source',
    content_owner TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'archived')),
    version TEXT DEFAULT '1.0.0',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_dept ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_group ON projects(official_group_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_submission_type ON projects(submission_type);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);


