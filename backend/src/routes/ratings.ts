import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { db } from '../db/database.js';

const router = Router({ mergeParams: true });

// Ensure the project exists and is published, return it
function getPublishedProject(projectId: string): any | null {
  const project = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId) as any;
  if (!project || project.status !== 'approved') return null;
  return project;
}

// Check if the requesting user is an owner/member of the project
function isProjectMember(project: any, user: any): boolean {
  // Individual project owner
  if (project.submission_type === 'individual' && project.owner_user_id === user.id) return true;

  // Group project: check if user is a member
  if (project.official_group_id) {
    const membership = db.prepare(
      `SELECT id FROM official_group_members WHERE group_id = ? AND user_id = ? AND invite_status = 'accepted'`
    ).get(project.official_group_id, user.id);
    if (membership) return true;

    // Also check leader
    const group = db.prepare(`SELECT leader_id FROM official_groups WHERE id = ?`).get(project.official_group_id) as any;
    if (group && group.leader_id === user.id) return true;
  }

  return false;
}

// Recompute aggregate from stored ratings
function recomputeAggregate(projectId: string): { avg: number; count: number } {
  const agg = db.prepare(
    `SELECT COUNT(*) as count, AVG(score) as avg FROM project_ratings WHERE project_id = ?`
  ).get(projectId) as any;
  const count = agg.count || 0;
  const avg = count > 0 ? Math.round((agg.avg || 0) * 10) / 10 : 0;
  return { avg, count };
}

// GET /api/projects/:projectId/ratings
// Public: returns aggregate + current user's rating if authenticated
router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = getPublishedProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found or not published.' });
      return;
    }

    const { avg, count } = recomputeAggregate(projectId);

    const sessionUserId = (req.session as any)?.userId;
    let myRating: number | null = null;
    if (sessionUserId) {
      const mine = db.prepare(
        `SELECT score FROM project_ratings WHERE project_id = ? AND user_id = ?`
      ).get(projectId, sessionUserId) as any;
      if (mine) myRating = mine.score;
    }

    res.json({ averageRating: avg, totalRatings: count, myRating });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/ratings  — Submit or update rating
router.post('/', authenticate, (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;
    const { score } = req.body;

    const project = getPublishedProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found or not published.' });
      return;
    }

    // Self-rating prevention
    if (isProjectMember(project, user)) {
      res.status(403).json({ error: 'Project owners and team members cannot rate their own project.' });
      return;
    }

    const scoreInt = parseInt(score, 10);
    if (isNaN(scoreInt) || scoreInt < 1 || scoreInt > 5) {
      res.status(400).json({ error: 'Rating score must be an integer between 1 and 5.' });
      return;
    }

    const now = new Date().toISOString();

    // Upsert: insert or update (enforced by UNIQUE constraint on project_id + user_id)
    db.prepare(`
      INSERT INTO project_ratings (id, project_id, user_id, score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id, user_id) DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at
    `).run(`rate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, projectId, user.id, scoreInt, now, now);

    const { avg, count } = recomputeAggregate(projectId);
    res.json({ message: 'Rating saved.', averageRating: avg, totalRatings: count, myRating: scoreInt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId/ratings  — Remove own rating
router.delete('/', authenticate, (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;

    const project = getPublishedProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found or not published.' });
      return;
    }

    const result = db.prepare(
      `DELETE FROM project_ratings WHERE project_id = ? AND user_id = ?`
    ).run(projectId, user.id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'No rating found to remove.' });
      return;
    }

    const { avg, count } = recomputeAggregate(projectId);
    res.json({ message: 'Rating removed.', averageRating: avg, totalRatings: count, myRating: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
