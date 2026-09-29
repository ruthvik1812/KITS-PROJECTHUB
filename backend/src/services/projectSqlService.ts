import { db } from '../db/database.js';

export interface ProjectFilters {
  search?: string;
  department?: string;
  academicYear?: string;
  year?: string;
  technology?: string;
  difficulty?: string;
  projectType?: string;
  submissionType?: string; // 'all' | 'individual' | 'group'
  language?: string;
  equipment?: string;
  freeTools?: boolean;
  groupId?: string;
  ownerUserId?: string;
  page?: number;
  limit?: number;
}

export function getAllProjects(filters: ProjectFilters = {}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(500, filters.limit || 100));
  const offset = (page - 1) * limit;

  let query = `SELECT * FROM projects WHERE status = 'approved'`;
  const params: any[] = [];

  if (filters.search) {
    query += ` AND (title LIKE ? OR summary LIKE ? OR subject LIKE ? OR tools LIKE ?)`;
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (filters.department && filters.department !== 'all') {
    query += ` AND department_id = ?`;
    params.push(filters.department);
  }

  const yearFilter = filters.academicYear || filters.year;
  if (yearFilter && yearFilter !== 'all') {
    query += ` AND academic_year LIKE ?`;
    params.push(`%${yearFilter.replace('year-', '')}%`);
  }

  if (filters.technology && filters.technology !== 'all') {
    query += ` AND tools LIKE ?`;
    params.push(`%${filters.technology}%`);
  }

  if (filters.projectType && filters.projectType !== 'all') {
    query += ` AND (project_type = ? OR project_type LIKE ?)`;
    params.push(filters.projectType, `%${filters.projectType}%`);
  }

  if (filters.submissionType && filters.submissionType !== 'all') {
    query += ` AND submission_type = ?`;
    params.push(filters.submissionType);
  }

  if (filters.groupId) {
    query += ` AND official_group_id = ?`;
    params.push(filters.groupId);
  }

  if (filters.ownerUserId) {
    query += ` AND owner_user_id = ?`;
    params.push(filters.ownerUserId);
  }

  if (filters.difficulty) {
    query += ` AND difficulty = ?`;
    params.push(filters.difficulty);
  }

  if (filters.language) {
    query += ` AND language LIKE ?`;
    params.push(`%${filters.language}%`);
  }

  if (filters.freeTools) {
    query += ` AND free_tools_route IS NOT NULL`;
  }

  // Count total matching
  const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
  const countStmt = db.prepare(countQuery);
  const total = (countStmt.get(...params) as { total: number }).total;

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  // Parse JSON fields
  const projects = rows.map(formatProjectRecord);

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export function getProjectById(id: string) {
  const stmt = db.prepare(`SELECT * FROM projects WHERE id = ?`);
  const row = stmt.get(id) as any;
  if (!row) return null;

  return formatProjectRecord(row);
}

export function getProjectByGroupId(groupId: string) {
  const stmt = db.prepare(`SELECT * FROM projects WHERE official_group_id = ?`);
  const row = stmt.get(groupId) as any;
  if (!row) return null;

  return formatProjectRecord(row);
}

/**
 * Retrieves all projects for a student's profile:
 * 1. Individual projects where owner_user_id = userId
 * 2. Group projects where the student is the group leader (leader_id)
 * 3. Group projects where the student has a CONFIRMED (accepted) membership row
 *
 * SECURITY: invite_status = 'accepted' is enforced in the JOIN condition.
 * Pending or declined invites do NOT grant any project access.
 * Returns deduplicated results, newest first.
 */
export function getMyProjects(userId: string, rollNumber?: string, role?: string) {
  if (role === 'admin') {
    const all = db.prepare(`SELECT * FROM projects ORDER BY created_at DESC`).all() as any[];
    const projects = all.map(formatProjectRecord);
    return {
      projects,
      counts: {
        all: projects.length,
        individual: projects.filter(p => p.submission_type === 'individual').length,
        group: projects.filter(p => p.submission_type === 'group').length
      }
    };
  }

  const cleanRoll = rollNumber ? rollNumber.trim().toUpperCase() : '';

  // JOIN on confirmed members only — invite_status filter is in the JOIN, not WHERE,
  // so we correctly exclude projects where the only matching member row is pending/declined.
  const query = `
    SELECT DISTINCT p.* FROM projects p
    LEFT JOIN official_groups g ON p.official_group_id = g.id
    LEFT JOIN official_group_members m
      ON g.id = m.group_id AND m.invite_status = 'accepted'
    WHERE (
      (p.submission_type = 'individual' AND p.owner_user_id = ?)
      OR (p.submission_type = 'group' AND g.leader_id = ?)
      OR (p.submission_type = 'group' AND m.user_id = ?)
      ${cleanRoll ? "OR (p.submission_type = 'group' AND m.student_roll_number = ?)" : ''}
    )
    ORDER BY p.created_at DESC
  `;

  const params: any[] = cleanRoll
    ? [userId, userId, userId, cleanRoll]
    : [userId, userId, userId];

  const rows = db.prepare(query).all(...params) as any[];
  const projects = rows.map(formatProjectRecord);

  return {
    projects,
    counts: {
      all: projects.length,
      individual: projects.filter(p => p.submission_type === 'individual').length,
      group: projects.filter(p => p.submission_type === 'group').length
    }
  };
}

export function getDepartments() {
  const stmt = db.prepare(`SELECT * FROM departments ORDER BY name ASC`);
  return stmt.all();
}

export function getAllTechnologies(): string[] {
  const rows = db.prepare(`SELECT tools FROM projects WHERE status = 'approved' AND tools IS NOT NULL`).all() as any[];
  const set = new Set<string>();
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.tools || '[]');
      if (Array.isArray(parsed)) {
        for (const t of parsed) {
          if (t && typeof t === 'string') set.add(t.trim());
        }
      }
    } catch {
      // ignore
    }
  }
  return Array.from(set).sort();
}

export function getAllBatches(): string[] {
  const rows = db.prepare(`
    SELECT DISTINCT academic_year FROM projects 
    WHERE status = 'approved' AND academic_year IS NOT NULL 
    ORDER BY academic_year DESC
  `).all() as any[];
  return rows.map(r => r.academic_year);
}

export function updateProject(id: string, data: {
  title: string;
  summary: string;
  problemStatement?: string;
  subject?: string;
  projectType?: string;
  departmentId: string;
  academicYear: string;
  liveDemoUrl?: string;
  repoUrl?: string;
  documentationUrl?: string;
  videoUrl?: string;
  presentationUrl?: string;
  screenshots?: string[];
  facultyMentorName?: string;
  facultyMentorRole?: string;
  hardwareEvidence?: any;
  tools?: string[];
  members?: Array<{ name: string; rollNumber?: string; role?: string; contribution: string }>;
  supportingResources?: any;
}) {
  const existing = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as any;
  if (!existing) {
    throw new Error(`Project with ID ${id} not found.`);
  }

  const now = new Date().toISOString();
  const membersJson = JSON.stringify(data.members || JSON.parse(existing.original_authors || '[]'));
  const toolsJson = JSON.stringify(data.tools || JSON.parse(existing.tools || '[]'));
  const screenshotsJson = data.screenshots !== undefined ? JSON.stringify(data.screenshots) : existing.screenshots;
  const hwJson = data.hardwareEvidence ? JSON.stringify(data.hardwareEvidence) : existing.hardware_evidence;

  db.prepare(`
    UPDATE projects SET
      title = ?,
      summary = ?,
      problem_statement = ?,
      subject = ?,
      project_type = ?,
      department_id = ?,
      academic_year = ?,
      live_demo_url = ?,
      repo_url = ?,
      documentation_url = ?,
      video_url = ?,
      presentation_url = ?,
      screenshots = ?,
      faculty_mentor_name = ?,
      faculty_mentor_role = ?,
      hardware_evidence = ?,
      tools = ?,
      original_authors = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    data.title,
    data.summary,
    data.problemStatement !== undefined ? data.problemStatement : existing.problem_statement,
    data.subject || existing.subject,
    data.projectType || existing.project_type || 'Major Capstone Project',
    data.departmentId,
    data.academicYear,
    data.liveDemoUrl !== undefined ? data.liveDemoUrl : existing.live_demo_url,
    data.repoUrl !== undefined ? data.repoUrl : existing.repo_url,
    data.documentationUrl !== undefined ? data.documentationUrl : existing.documentation_url,
    data.videoUrl !== undefined ? data.videoUrl : existing.video_url,
    data.presentationUrl !== undefined ? data.presentationUrl : existing.presentation_url,
    screenshotsJson,
    data.facultyMentorName !== undefined ? data.facultyMentorName : (existing.submission_type === 'individual' ? null : (existing.faculty_mentor_name || 'Dr. M. Ravindra Babu')),
    data.facultyMentorRole !== undefined ? data.facultyMentorRole : (existing.submission_type === 'individual' ? null : (existing.faculty_mentor_role || 'Professor & HOD · CSE')),
    hwJson,
    toolsJson,
    membersJson,
    now,
    id
  );

  return getProjectById(id);
}

export function formatProjectRecord(row: any) {
  let groupDetails: any = null;
  let leaderName = '';
  let confirmedMembers: any[] = [];

  if (row.official_group_id) {
    try {
      const grp = db.prepare(`SELECT id, name, leader_id, status FROM official_groups WHERE id = ?`).get(row.official_group_id) as any;
      if (grp) {
        const leader = db.prepare(`SELECT id, full_name, student_roll_number FROM users WHERE id = ?`).get(grp.leader_id) as any;
        leaderName = leader?.full_name || 'Team Leader';

        const members = db.prepare(`
          SELECT m.user_id, m.student_roll_number, u.full_name, m.invite_status
          FROM official_group_members m
          JOIN users u ON m.user_id = u.id
          WHERE m.group_id = ? AND m.invite_status = 'accepted'
          ORDER BY (m.user_id = ?) DESC, u.full_name ASC
        `).all(grp.id, grp.leader_id) as any[];

        confirmedMembers = members.map(m => ({
          userId: m.user_id,
          rollNumber: m.student_roll_number,
          fullName: m.full_name,
          isLeader: m.user_id === grp.leader_id
        }));

        groupDetails = {
          ...grp,
          leader_name: leaderName,
          leader_roll_number: leader?.student_roll_number,
          confirmed_members: confirmedMembers
        };
      }
    } catch {}
  }

  // Resolve uploader display name
  let uploaderDisplayName = row.content_owner || 'KITS Student';
  if (row.owner_user_id) {
    try {
      const uploader = db.prepare(`SELECT full_name FROM users WHERE id = ?`).get(row.owner_user_id) as any;
      if (uploader?.full_name) {
        uploaderDisplayName = uploader.full_name;
      }
    } catch {}
  }

  // Attach live rating aggregate
  let averageRating = 0;
  let totalRatings = 0;
  try {
    const agg = db.prepare(
      `SELECT COUNT(*) as count, AVG(score) as avg FROM project_ratings WHERE project_id = ?`
    ).get(row.id) as any;
    totalRatings = agg?.count || 0;
    averageRating = totalRatings > 0 ? Math.round((agg?.avg || 0) * 10) / 10 : 0;
  } catch { /* table may not exist yet on first boot */ }

  const submissionType = row.submission_type || (row.official_group_id ? 'group' : 'individual');

  return {
    ...row,
    submission_type: submissionType,
    submissionType,
    owner_user_id: row.owner_user_id || null,
    problem_statement: row.problem_statement || null,
    problemStatement: row.problem_statement || null,
    video_url: row.video_url || null,
    videoUrl: row.video_url || null,
    group: groupDetails,
    project_type: row.project_type || (submissionType === 'individual' ? 'Individual Project' : 'Group Capstone Project'),
    projectType: row.project_type || (submissionType === 'individual' ? 'Individual Project' : 'Group Capstone Project'),
    faculty_mentor_name: submissionType === 'individual' ? (row.faculty_mentor_name || null) : (row.faculty_mentor_name || 'Dr. M. Ravindra Babu'),
    faculty_mentor_role: submissionType === 'individual' ? (row.faculty_mentor_role || null) : (row.faculty_mentor_role || 'Professor & HOD · CSE'),
    documentation_url: row.documentation_url || null,
    presentation_url: row.presentation_url || null,
    presentationUrl: row.presentation_url || null,
    links: {
      website: row.live_demo_url || null,
      repository: row.repo_url || null,
      documentation: row.documentation_url || null,
      video: row.video_url || null,
      presentation: row.presentation_url || null
    },
    screenshots: parseJsonSafe(row.screenshots, []),
    outcomes: parseJsonSafe(row.outcomes, []),
    prerequisites: parseJsonSafe(row.prerequisites, []),
    tools: parseJsonSafe(row.tools, []),
    original_authors: parseJsonSafe(row.original_authors, []),
    hardware_evidence: parseJsonSafe(row.hardware_evidence, null),
    averageRating,
    totalRatings,
    uploader_display_name: uploaderDisplayName,
    uploader_name: uploaderDisplayName,
    uploaderName: uploaderDisplayName,
    leader_name: leaderName,
    leaderName: leaderName,
    confirmed_members: confirmedMembers,
  };
}

function parseJsonSafe(str: any, fallback: any) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}


