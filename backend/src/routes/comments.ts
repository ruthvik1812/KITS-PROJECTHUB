import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { db } from '../db/database.js';

const router = Router({ mergeParams: true });

const MAX_COMMENT_LENGTH = 1000;
const COMMENTS_PER_PAGE = 10;

function getPublishedProject(projectId: string): any | null {
  const project = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId) as any;
  if (!project || project.status !== 'approved') return null;
  return project;
}

function formatComment(row: any): object {
  return {
    id: row.id,
    projectId: row.project_id,
    authorId: row.user_id,
    authorName: row.full_name || 'KITS Student',
    // Never expose email or roll number
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isEdited: row.is_edited === 1,
  };
}

// GET /api/projects/:projectId/comments?page=1
// Public: paginated, newest first
router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = getPublishedProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found or not published.' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const offset = (page - 1) * COMMENTS_PER_PAGE;

    const rows = db.prepare(`
      SELECT c.*, u.full_name
      FROM project_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.project_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(projectId, COMMENTS_PER_PAGE, offset) as any[];

    const total = (db.prepare(
      `SELECT COUNT(*) as count FROM project_comments WHERE project_id = ?`
    ).get(projectId) as any).count;

    res.json({
      comments: rows.map(formatComment),
      pagination: {
        total,
        page,
        perPage: COMMENTS_PER_PAGE,
        hasMore: offset + rows.length < total,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/comments
router.post('/', authenticate, (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;

    const project = getPublishedProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found or not published.' });
      return;
    }

    const text: string = (req.body.text || '').trim();
    if (!text) {
      res.status(400).json({ error: 'Comment text cannot be empty.' });
      return;
    }
    if (text.length > MAX_COMMENT_LENGTH) {
      res.status(400).json({ error: `Comment must not exceed ${MAX_COMMENT_LENGTH} characters.` });
      return;
    }

    const now = new Date().toISOString();
    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    db.prepare(`
      INSERT INTO project_comments (id, project_id, user_id, text, is_edited, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(commentId, projectId, user.id, text, now, now);

    const row = db.prepare(`
      SELECT c.*, u.full_name FROM project_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `).get(commentId) as any;

    res.status(201).json({ message: 'Comment posted.', comment: formatComment(row) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:projectId/comments/:commentId
router.put('/:commentId', authenticate, (req: Request, res: Response) => {
  try {
    const { projectId, commentId } = req.params;
    const user = (req as any).user;

    const comment = db.prepare(
      `SELECT * FROM project_comments WHERE id = ? AND project_id = ?`
    ).get(commentId, projectId) as any;

    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }
    if (comment.user_id !== user.id) {
      res.status(403).json({ error: 'You can only edit your own comments.' });
      return;
    }

    const text: string = (req.body.text || '').trim();
    if (!text) {
      res.status(400).json({ error: 'Comment text cannot be empty.' });
      return;
    }
    if (text.length > MAX_COMMENT_LENGTH) {
      res.status(400).json({ error: `Comment must not exceed ${MAX_COMMENT_LENGTH} characters.` });
      return;
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE project_comments SET text = ?, is_edited = 1, updated_at = ? WHERE id = ?`
    ).run(text, now, commentId);

    const row = db.prepare(`
      SELECT c.*, u.full_name FROM project_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `).get(commentId) as any;

    res.json({ message: 'Comment updated.', comment: formatComment(row) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId/comments/:commentId
router.delete('/:commentId', authenticate, (req: Request, res: Response) => {
  try {
    const { projectId, commentId } = req.params;
    const user = (req as any).user;

    const comment = db.prepare(
      `SELECT * FROM project_comments WHERE id = ? AND project_id = ?`
    ).get(commentId, projectId) as any;

    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }
    if (comment.user_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'You can only delete your own comments.' });
      return;
    }

    db.prepare(`DELETE FROM project_comments WHERE id = ?`).run(commentId);
    res.json({ message: 'Comment deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
