import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authenticate.js';
import {
  getAllProjects,
  getProjectById,
  getProjectByGroupId,
  getMyProjects,
  getDepartments,
  getAllTechnologies,
  getAllBatches,
  updateProject,
  recordProjectView,
  recordProjectShare
} from '../services/projectSqlService.js';
import { db } from '../db/database.js';
import { validateGitHubRepoUrl } from '../services/githubValidator.js';

const router = Router();

// POST /api/projects/upload-doc (Handle direct file uploads - Authenticated)
router.post('/upload-doc', authenticate, (req: Request, res: Response) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      res.status(400).json({ error: 'File name and file data are required.' });
      return;
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // fileData can be "data:application/pdf;base64,..." or raw base64
    const matches = fileData.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    const base64Data = matches ? matches[2] : fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = path.extname(fileName) || '.pdf';
    const cleanName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const savedFileName = `${Date.now()}_${cleanName}${ext}`;
    const filePath = path.join(uploadsDir, savedFileName);

    fs.writeFileSync(filePath, buffer);
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${savedFileName}`;
    res.json({ url: fileUrl, fileName: savedFileName });
  } catch (error: any) {
    console.error('File upload processing error:', error);
    res.status(500).json({ error: 'Failed to process and upload file. Please try again.' });
  }
});

// GET /api/projects/departments
router.get('/departments', (_req: Request, res: Response) => {
  try {
    const departments = getDepartments();
    res.json(departments);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to retrieve academic departments. Please try again later.' });
  }
});

// GET /api/projects/technologies
router.get('/technologies', (_req: Request, res: Response) => {
  try {
    const technologies = getAllTechnologies();
    res.json(technologies);
  } catch (error: any) {
    console.error('Error fetching technologies:', error);
    res.status(500).json({ error: 'Failed to retrieve technologies. Please try again later.' });
  }
});

// GET /api/projects/batches
router.get('/batches', (_req: Request, res: Response) => {
  try {
    const batches = getAllBatches();
    res.json(batches);
  } catch (error: any) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to retrieve batches. Please try again later.' });
  }
});

// GET /api/projects/my-projects (Fetch student's individual & group projects)
router.get('/my-projects', (req: Request, res: Response) => {
  try {
    const sessionUserId = (req.session as any)?.userId;
    const authUser = sessionUserId
      ? (db.prepare(`SELECT * FROM users WHERE id = ?`).get(sessionUserId) as any)
      : null;

    let userId = authUser?.id || (req.query.userId as string);
    let rollNumber = authUser?.student_roll_number || (req.query.rollNumber as string);

    if (!userId && !rollNumber) {
      res.json({ projects: [], counts: { all: 0, individual: 0, group: 0 } });
      return;
    }

    if (userId && !rollNumber) {
      const user = db.prepare(`SELECT student_roll_number FROM users WHERE id = ?`).get(userId) as any;
      if (user?.student_roll_number) {
        rollNumber = user.student_roll_number;
      }
    }

    const result = getMyProjects(userId || '', rollNumber, authUser?.role);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ error: 'Failed to retrieve projects. Please try again later.' });
  }
});

// GET /api/projects/by-group/:groupId
router.get('/by-group/:groupId', (req: Request, res: Response) => {
  try {
    const project = getProjectByGroupId(req.params.groupId);
    if (!project) {
      res.status(404).json({ error: 'No project found for this group' });
      return;
    }
    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project by group ID:', error);
    res.status(500).json({ error: 'Failed to retrieve group project. Please try again later.' });
  }
});

// GET /api/projects (universal browsing, search, department/year/technology/submissionType filters, pagination)
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      search,
      department,
      year,
      academicYear,
      technology,
      difficulty,
      projectType,
      submissionType,
      language,
      equipment,
      freeTools,
      groupId,
      ownerUserId,
      page,
      limit
    } = req.query;

    const limitStr = limit ? String(limit).toLowerCase().trim() : '';
    const isExplicitlyUnlimited = limitStr === 'all' || limitStr === 'unlimited' || limitStr === '0' || limitStr === '-1';
    const limitNum = limit ? parseInt(limit as string, 10) : -1;
    const isUnlimited = isExplicitlyUnlimited || !limit || limitNum <= 0;

    const result = getAllProjects({
      search: search as string,
      department: department as string,
      year: (year || academicYear) as string,
      technology: technology as string,
      difficulty: difficulty as string,
      projectType: projectType as string,
      submissionType: submissionType as string,
      language: language as string,
      equipment: equipment as string,
      freeTools: freeTools === 'true',
      groupId: groupId as string,
      ownerUserId: ownerUserId as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: isUnlimited ? -1 : limitNum,
      unlimited: isUnlimited,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error querying projects:', error);
    res.status(500).json({ error: 'Failed to retrieve projects. Please try again later.' });
  }
});

// GET /api/projects/:id (get completed project details)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error: any) {
    console.error('Error retrieving project details:', error);
    res.status(500).json({ error: 'Failed to retrieve project details. Please try again later.' });
  }
});

function isProjectSpecificUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return false;
  try {
    const parsed = new URL(clean);
    const host = parsed.hostname;
    const path = parsed.pathname.replace(/\/+$/, '');
    // Generic domains without repo/project paths do not uniquely identify a project
    if ((host.includes('github.com') || host.includes('gitlab.com') || host.includes('bitbucket.org')) && (!path || path === '' || path === '/')) {
      return false;
    }
    if (host === 'localhost' || host === '127.0.0.1') return false;
    return clean.length > 12 && path.length > 1;
  } catch {
    return false;
  }
}

// POST /api/projects (Upload Individual or Group Project - Authenticated)
router.post('/', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      submissionType = 'group', // 'individual' | 'group'
      groupId,
      title,
      summary,
      problemStatement,
      subject,
      projectType,
      difficulty,
      duration,
      language,
      equipment,
      freeToolsRoute,
      liveDemoUrl,
      repoUrl,
      documentationUrl,
      videoUrl,
      presentationUrl,
      screenshots,
      facultyMentorName,
      facultyMentorRole,
      hardwareEvidence,
      outcomes,
      prerequisites,
      tools,
      departmentId,
      academicYear,
      licence,
      contentOwner,
      members // Optional custom members array from submission form (Group project only)
    } = req.body;

    const isIndividual = submissionType === 'individual';

    // 1. Required field checks for all project types
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Project title is required.' });
      return;
    }
    if (!summary || !summary.trim()) {
      res.status(400).json({ error: 'Project description / problem statement is required.' });
      return;
    }
    if (!departmentId) {
      res.status(400).json({ error: 'Department selection is required.' });
      return;
    }
    if (!academicYear) {
      res.status(400).json({ error: 'Academic year / batch is required.' });
      return;
    }

    let finalGroupId: string | null = null;
    let finalMembersList: any[] = [];
    let group: any = null;

    if (isIndividual) {
      // Individual project has exactly one student owner (the authenticated student)
      finalMembersList = [
        {
          name: user.full_name || user.name || 'Student Author',
          rollNumber: user.student_roll_number || user.rollNumber || 'Verified Student',
          role: 'Project Author & Developer',
          contribution: 'Designed, engineered, implemented, and demonstrated the individual solution.'
        }
      ];
    } else {
      // Group project: 4–6 confirmed students
      if (groupId) {
        group = db.prepare(`SELECT * FROM official_groups WHERE id = ?`).get(groupId) as any;
      }

      if (group) {
        // Enforce that only the confirmed team leader can upload the shared group project
        if (group.leader_id !== user.id && user.role !== 'admin') {
          res.status(403).json({
            error: 'Permission denied: Only the designated team leader of this official group can upload the shared project.'
          });
          return;
        }

        const confirmedDbMembers = db.prepare(`
          SELECT m.*, u.full_name, u.student_roll_number
          FROM official_group_members m
          JOIN users u ON m.user_id = u.id
          WHERE m.group_id = ? AND m.invite_status = 'accepted'
        `).all(group.id) as any[];

        if (confirmedDbMembers.length < 4 || confirmedDbMembers.length > 6) {
          res.status(400).json({
            error: `Group project submission requires 4 to 6 confirmed students in the group roster. Currently confirmed: ${confirmedDbMembers.length}. Please ensure invited members accept their invitations before submitting.`
          });
          return;
        }

        // Build final members list strictly from confirmed DB accounts
        const payloadMemberMap = new Map<string, any>();
        if (Array.isArray(members)) {
          for (const m of members) {
            const key = (m.rollNumber || '').trim().toUpperCase();
            if (key) payloadMemberMap.set(key, m);
          }
        }

        finalMembersList = confirmedDbMembers.map(m => {
          const payload = payloadMemberMap.get((m.student_roll_number || '').toUpperCase());
          return {
            name: m.full_name,
            rollNumber: m.student_roll_number,
            userId: m.user_id,
            role: payload?.role || (m.user_id === group.leader_id ? 'Team Leader' : 'Team Member'),
            contribution: payload?.contribution || 'Contributed to engineering design, implementation and verification.'
          };
        });
        finalGroupId = group.id;
      } else {
        // Auto-provision official group from provided members list
        if (!Array.isArray(members) || members.length < 4 || members.length > 6) {
          res.status(400).json({
            error: `Group size check failed: Each group project requires 4 to 6 confirmed students. Provided count: ${Array.isArray(members) ? members.length : 0}.`
          });
          return;
        }

        finalMembersList = members;
        finalGroupId = groupId || `grp-${Date.now()}`;

        // Create official group entry in DB
        db.prepare(`
          INSERT INTO official_groups (id, name, department_id, academic_year, leader_id, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?)
        `).run(finalGroupId, title.trim() + ' Team', departmentId, academicYear, user.id, new Date().toISOString(), new Date().toISOString());

        // Also record leader into official_group_members
        const leaderRoll = (user.student_roll_number || '').trim().toUpperCase();
        try {
          db.prepare(`
            INSERT INTO official_group_members (id, group_id, user_id, student_roll_number, invite_status, joined_at, created_at)
            VALUES (?, ?, ?, ?, 'accepted', ?, ?)
          `).run(`mem-${Date.now()}-ldr`, finalGroupId, user.id, leaderRoll, new Date().toISOString(), new Date().toISOString());
        } catch {}

        // Link registered students for remaining group members
        for (const m of finalMembersList) {
          const mRoll = (m.rollNumber || '').trim().toUpperCase();
          if (mRoll && mRoll !== leaderRoll) {
            const regUser = db.prepare(`SELECT id FROM users WHERE UPPER(student_roll_number) = ?`).get(mRoll) as any;
            if (regUser) {
              try {
                db.prepare(`
                  INSERT INTO official_group_members (id, group_id, user_id, student_roll_number, invite_status, joined_at, created_at)
                  VALUES (?, ?, ?, ?, 'accepted', ?, ?)
                `).run(`mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, finalGroupId, regUser.id, mRoll, new Date().toISOString(), new Date().toISOString());
              } catch {}
            }
          }
        }
      }

      if (finalMembersList.length < 4 || finalMembersList.length > 6) {
        res.status(400).json({
          error: `Group size check failed: Each group must contain 4 to 6 confirmed students. Provided count: ${finalMembersList.length}.`
        });
        return;
      }

      // Validate member contributions
      for (let i = 0; i < finalMembersList.length; i++) {
        const m = finalMembersList[i];
        if (!m.name || !m.name.trim()) {
          res.status(400).json({ error: `Member #${i + 1} is missing a full name.` });
          return;
        }
        if (!m.contribution || !m.contribution.trim()) {
          res.status(400).json({ error: `Member "${m.name}" is missing their individual contribution.` });
          return;
        }
      }

      // Check if group already has an uploaded project (one shared project per group limit)
      const checkId = finalGroupId || groupId;
      if (checkId) {
        const existingGroupProj = db.prepare(`SELECT id, title FROM projects WHERE official_group_id = ?`).get(checkId) as any;
        if (existingGroupProj) {
          res.status(409).json({
            error: `A project has already been submitted for this group ("${existingGroupProj.title}"). Please edit the existing group project instead.`,
            existingProjectId: existingGroupProj.id
          });
          return;
        }
      }

      finalGroupId = checkId || null;
    }

    // Validate GitHub repository link
    const gitHubValidation = validateGitHubRepoUrl(repoUrl);
    if (!gitHubValidation.valid) {
      res.status(400).json({ error: gitHubValidation.error });
      return;
    }
    const cleanRepo = gitHubValidation.normalized!;
    const cleanDemo = liveDemoUrl ? liveDemoUrl.trim() : '';

    if (isProjectSpecificUrl(cleanRepo) || isProjectSpecificUrl(cleanDemo)) {
      const duplicateUrl = db.prepare(`
        SELECT id, title, submission_type FROM projects
        WHERE (? != '' AND repo_url = ?)
           OR (? != '' AND live_demo_url = ?)
      `).get(
        isProjectSpecificUrl(cleanRepo) ? cleanRepo : '',
        cleanRepo,
        isProjectSpecificUrl(cleanDemo) ? cleanDemo : '',
        cleanDemo
      ) as any;

      if (duplicateUrl) {
        res.status(409).json({
          error: `This project URL is already linked to project "${duplicateUrl.title}". Duplicate submissions are prevented.`
        });
        return;
      }
    }

    const projectId = `kits-proj-${Date.now()}`;
    const now = new Date().toISOString();
    const toolsArray = Array.isArray(tools) ? tools : (typeof tools === 'string' ? tools.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
    const screenshotsArray = Array.isArray(screenshots) ? screenshots : [];

    const execute = db.transaction(() => {
      if (finalGroupId) {
        // Freeze group status to confirmed
        db.prepare(`UPDATE official_groups SET status = 'confirmed', updated_at = ? WHERE id = ?`).run(now, finalGroupId);
      }

      // Insert project - PUBLISH IMMEDIATELY (status = 'approved')
      db.prepare(`
        INSERT INTO projects (
          id, submission_type, owner_user_id, official_group_id, title, summary, problem_statement, subject, project_type, difficulty, duration, language, equipment, free_tools_route,
          live_demo_url, repo_url, documentation_url, video_url, presentation_url, screenshots, faculty_mentor_name, faculty_mentor_role, hardware_evidence, outcomes, prerequisites, tools, original_authors, department_id,
          academic_year, licence, content_owner, status, version, views_count, likes_count, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, 'approved', '1.0.0', 1, 0, ?, ?
        )
      `).run(
        projectId,
        isIndividual ? 'individual' : 'group',
        user.id,
        finalGroupId,
        title.trim(),
        summary.trim(),
        problemStatement ? problemStatement.trim() : null,
        subject || 'Engineering Project',
        projectType || (isIndividual ? 'Individual Project' : 'Major Capstone Project'),
        difficulty || 'Intermediate',
        duration || 'Completed Project',
        language || 'English',
        equipment || 'Standard Hardware & Lab Tools',
        freeToolsRoute || 'Achievable with open-source tools',
        cleanDemo || null,
        cleanRepo || null,
        documentationUrl ? documentationUrl.trim() : null,
        videoUrl ? videoUrl.trim() : null,
        presentationUrl ? presentationUrl.trim() : null,
        JSON.stringify(screenshotsArray),
        isIndividual ? null : (facultyMentorName ? facultyMentorName.trim() : ''),
        isIndividual ? null : (facultyMentorRole ? facultyMentorRole.trim() : ''),
        hardwareEvidence ? JSON.stringify(hardwareEvidence) : null,
        JSON.stringify(outcomes || ['Completed functional engineering solution', 'Verified demonstration']),
        JSON.stringify(prerequisites || []),
        JSON.stringify(toolsArray),
        JSON.stringify(finalMembersList),
        departmentId || (group ? group.department_id : 'cse'),
        academicYear || (group ? group.academic_year : '2026-2027'),
        licence || 'CC BY-NC 4.0 / KITS Institutional Repository',
        contentOwner || finalMembersList[0]?.name || user.full_name || 'KITS Student',
        now,
        now
      );
    });

    execute();

    const createdProject = getProjectById(projectId);
    res.status(201).json({
      message: `${isIndividual ? 'Individual' : 'Group'} project published immediately to KITS ProjectHub repository.`,
      projectId,
      project: createdProject
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to publish project. Please verify inputs and try again.' });
  }
});

// PUT /api/projects/:id (Edit project - Authenticated, strict permission enforcement, retains existing ID)
router.put('/:id', authenticate, (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const user = (req as any).user;
    const {
      title,
      summary,
      problemStatement,
      subject,
      projectType,
      departmentId,
      academicYear,
      liveDemoUrl,
      repoUrl,
      documentationUrl,
      videoUrl,
      presentationUrl,
      screenshots,
      facultyMentorName,
      facultyMentorRole,
      hardwareEvidence,
      tools,
      members
    } = req.body;

    const existing = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const isGroupProject = existing.submission_type === 'group' || Boolean(existing.official_group_id);

    // Enforce strict ownership permissions on backend:
    // Only owner can edit individual project; only group leader can edit group project.
    if (isGroupProject) {
      if (existing.official_group_id) {
        const group = db.prepare(`SELECT * FROM official_groups WHERE id = ?`).get(existing.official_group_id) as any;
        if (group && group.leader_id !== user.id && user.role !== 'admin') {
          res.status(403).json({
            error: 'Permission denied: Only the team leader of this official group can edit the shared project.'
          });
          return;
        }
      } else if (existing.owner_user_id && existing.owner_user_id !== user.id && user.role !== 'admin') {
        res.status(403).json({
          error: 'Permission denied: Only the owner of this project can edit it.'
        });
        return;
      }
    } else {
      // Individual project ownership check
      if (existing.owner_user_id && existing.owner_user_id !== user.id && user.role !== 'admin') {
        res.status(403).json({
          error: 'Permission denied: Only the author / owner of this individual project can edit it.'
        });
        return;
      }
    }

    // Required field validation
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Project title cannot be empty.' });
      return;
    }
    if (!summary || !summary.trim()) {
      res.status(400).json({ error: 'Project summary / description cannot be empty.' });
      return;
    }
    if (!departmentId) {
      res.status(400).json({ error: 'Department selection is required.' });
      return;
    }
    if (!academicYear) {
      res.status(400).json({ error: 'Academic year / batch is required.' });
      return;
    }

    // Validate GitHub repository link if provided or updated
    let cleanRepo = existing.repo_url || '';
    if (repoUrl !== undefined) {
      const gitHubValidation = validateGitHubRepoUrl(repoUrl);
      if (!gitHubValidation.valid) {
        res.status(400).json({ error: gitHubValidation.error });
        return;
      }
      cleanRepo = gitHubValidation.normalized!;
    }
    const cleanDemo = liveDemoUrl !== undefined ? liveDemoUrl.trim() : (existing.live_demo_url || '');

    if (isProjectSpecificUrl(cleanRepo) || isProjectSpecificUrl(cleanDemo)) {
      const duplicateUrl = db.prepare(`
        SELECT id, title FROM projects
        WHERE id != ?
          AND (
            (? != '' AND repo_url = ?)
            OR (? != '' AND live_demo_url = ?)
          )
      `).get(
        projectId,
        isProjectSpecificUrl(cleanRepo) ? cleanRepo : '',
        cleanRepo,
        isProjectSpecificUrl(cleanDemo) ? cleanDemo : '',
        cleanDemo
      ) as any;

      if (duplicateUrl) {
        res.status(409).json({
          error: `Duplicate link check: Project URL matches existing project "${duplicateUrl.title}" (${duplicateUrl.id}).`
        });
        return;
      }
    }

    // Validate members if provided for group projects
    let membersToSave = members;
    if (isGroupProject && Array.isArray(members) && members.length > 0) {
      if (members.length < 4 || members.length > 6) {
        res.status(400).json({
          error: `Group size check failed: Must contain 4 to 6 confirmed students. Provided count: ${members.length}.`
        });
        return;
      }
      for (const m of members) {
        if (!m.name || !m.name.trim()) {
          res.status(400).json({ error: 'All members must have a full name.' });
          return;
        }
        if (!m.contribution || !m.contribution.trim()) {
          res.status(400).json({ error: `Member "${m.name}" must have a contribution description.` });
          return;
        }
      }
    } else if (!isGroupProject) {
      // Individual project retains single owner author
      membersToSave = [
        {
          name: user.full_name || user.name || 'Student Author',
          rollNumber: user.student_roll_number || user.rollNumber || 'Verified Student',
          role: 'Project Author & Developer',
          contribution: 'Designed, engineered, implemented, and demonstrated the individual solution.'
        }
      ];
    }

    const toolsArray = Array.isArray(tools) ? tools : (typeof tools === 'string' ? tools.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined);
    const screenshotsArray = Array.isArray(screenshots) ? screenshots : undefined;

    const updated = updateProject(projectId, {
      title: title.trim(),
      summary: summary.trim(),
      problemStatement: problemStatement !== undefined ? problemStatement.trim() : undefined,
      subject,
      projectType,
      departmentId,
      academicYear,
      liveDemoUrl: liveDemoUrl !== undefined ? liveDemoUrl.trim() : undefined,
      repoUrl: repoUrl !== undefined ? cleanRepo : undefined,
      documentationUrl: documentationUrl !== undefined ? documentationUrl.trim() : undefined,
      videoUrl: videoUrl !== undefined ? videoUrl.trim() : undefined,
      presentationUrl: presentationUrl !== undefined ? presentationUrl.trim() : undefined,
      screenshots: screenshotsArray,
      facultyMentorName: facultyMentorName !== undefined ? facultyMentorName.trim() : undefined,
      facultyMentorRole: facultyMentorRole !== undefined ? facultyMentorRole.trim() : undefined,
      hardwareEvidence,
      tools: toolsArray,
      members: membersToSave
    });

    res.json({
      message: 'Project updated successfully. Existing canonical ID retained.',
      projectId,
      project: updated
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project. Please verify inputs and try again.' });
  }
});

// DELETE /api/projects/:id (Delete project)
router.delete('/:id', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const project = getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const isGroupProject = project.submission_type === 'group' || Boolean(project.official_group_id);
    if (isGroupProject && project.official_group_id) {
      const group = db.prepare(`SELECT * FROM official_groups WHERE id = ?`).get(project.official_group_id) as any;
      if (group && group.leader_id !== user.id && user.role !== 'admin') {
        res.status(403).json({ error: 'Permission denied: Only the group leader or admin can delete this project.' });
        return;
      }
    } else if (project.owner_user_id && project.owner_user_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied: Only the project owner or admin can delete this project.' });
      return;
    }

    db.prepare(`DELETE FROM project_ratings WHERE project_id = ?`).run(project.id);
    db.prepare(`DELETE FROM project_comments WHERE project_id = ?`).run(project.id);
    db.prepare(`DELETE FROM projects WHERE id = ?`).run(project.id);

    res.json({ message: 'Project deleted successfully.', projectId: project.id });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project. Please try again later.' });
  }
});

// POST /api/projects/:id/view — Track deduplicated view count (24h per viewer)
router.post('/:id/view', (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const sessionUserId = (req.session as any)?.userId;
    const viewerKey = sessionUserId ? `user:${sessionUserId}` : `anon:${req.cookies?.kits_vid || req.ip || 'guest'}`;

    const result = recordProjectView(projectId, viewerKey);
    res.json({
      success: true,
      projectId,
      ...result
    });
  } catch (error: any) {
    console.error('Error recording project view:', error);
    if (error?.message?.includes('not found')) {
      res.status(404).json({ error: 'Project not found.' });
    } else {
      res.status(500).json({ error: 'Failed to record view. Please try again later.' });
    }
  }
});

// POST /api/projects/:id/share — Track verified share event with rate limiting
router.post('/:id/share', (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { shareType } = req.body || {};
    const sessionUserId = (req.session as any)?.userId;
    const sharerKey = sessionUserId ? `user:${sessionUserId}` : `anon:${req.cookies?.kits_vid || req.ip || 'guest'}`;

    const result = recordProjectShare(projectId, sharerKey, shareType || 'share');
    res.json({
      success: true,
      projectId,
      ...result,
      note: 'Share actions and copied links; recipient delivery is not verified.'
    });
  } catch (error: any) {
    console.error('Error recording project share:', error);
    if (error?.message?.includes('not found')) {
      res.status(404).json({ error: 'Project not found.' });
    } else {
      res.status(500).json({ error: 'Failed to record share. Please try again later.' });
    }
  }
});

export default router;
