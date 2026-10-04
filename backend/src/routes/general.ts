import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { db, clearAllData, store } from '../db/database.js';

const router = Router();

/**
 * GET /api/departments
 * Public: returns all academic departments from SQLite
 */
router.get('/departments', (_req: Request, res: Response) => {
  try {
    const departments = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to retrieve academic departments. Please try again later.' });
  }
});

/**
 * GET /api/users
 * Admin/Faculty: returns all users from SQLite for the governance panel
 */
router.get(
  '/users',
  authenticate,
  authorize('faculty', 'reviewer', 'admin'),
  (_req: Request, res: Response) => {
    try {
      const users = db.prepare(`
        SELECT id, email, full_name, role, department_id, student_roll_number, is_verified, photo_url, created_at, updated_at 
        FROM users 
        ORDER BY created_at DESC
      `).all();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to retrieve user accounts. Please try again later.' });
    }
  }
);

/**
 * PATCH /api/users/:id/role
 * Admin only: update user role and verification status
 */
router.patch(
  '/users/:id/role',
  authenticate,
  authorize('admin'),
  (req: Request, res: Response) => {
    try {
      const { role, isVerified, studentRollNumber, departmentId } = req.body;
      const now = new Date().toISOString();

      db.prepare(`
        UPDATE users 
        SET role = COALESCE(?, role),
            is_verified = COALESCE(?, is_verified),
            student_roll_number = COALESCE(?, student_roll_number),
            department_id = COALESCE(?, department_id),
            updated_at = ?
        WHERE id = ?
      `).run(role || null, isVerified !== undefined ? (isVerified ? 1 : 0) : null, studentRollNumber || null, departmentId || null, now, req.params.id);

      const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role. Please try again later.' });
    }
  }
);

/**
 * GET /api/health
 * Public: health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'kits-projecthub-backend',
    authType: 'Database Sessions (SQLite) / HttpOnly Cookies',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/database/clear
 * Clears all records from every table in the database
 */
router.post(['/database/clear', '/admin/clear-database'], (_req: Request, res: Response) => {
  try {
    clearAllData();
    res.json({
      success: true,
      message: 'All data in the database has been completely removed.',
      counts: {
        departments: store.departments.length,
        users: store.users.length,
        projects: store.projects.length,
        official_groups: store.official_groups.length,
        official_group_members: store.official_group_members.length,
        project_ratings: store.project_ratings.length,
        project_comments: store.project_comments.length,
        wishlists: store.wishlists.length,
        project_views: store.project_views.length,
        project_shares: store.project_shares.length,
      }
    });
  } catch (error: any) {
    console.error('Database clear error:', error);
    res.status(500).json({ error: 'Failed to clear database. Please try again later.' });
  }
});

/**
 * GET /api/database/status
 * Returns record counts for all database tables
 */
router.get('/database/status', (_req: Request, res: Response) => {
  res.json({
    departments: store.departments.length,
    users: store.users.length,
    projects: store.projects.length,
    official_groups: store.official_groups.length,
    official_group_members: store.official_group_members.length,
    project_ratings: store.project_ratings.length,
    project_comments: store.project_comments.length,
    wishlists: store.wishlists.length,
    project_views: store.project_views.length,
    project_shares: store.project_shares.length,
  });
});

export default router;
