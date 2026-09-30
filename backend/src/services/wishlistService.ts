import { db } from '../db/database.js';
import { formatProjectRecord } from './projectSqlService.js';
import crypto from 'crypto';

export interface WishlistItem {
  id: string;
  wishlistId: string;
  projectId: string;
  savedAt: string;
  isUnavailable?: boolean;
  project?: any;
}

/**
 * Retrieves the authenticated student's personal wishlist.
 * Newest saved first.
 * If a project is no longer available/approved, returns an unavailable state
 * with a removal option, without exposing restricted content.
 */
export function getUserWishlist(userId: string) {
  const rows = db.prepare(`
    SELECT id as wishlist_id, project_id, created_at as saved_at
    FROM wishlists
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as any[];

  return rows.map((row) => {
    const projRow = db.prepare(`
      SELECT * FROM projects 
      WHERE id = ? AND status = 'approved'
    `).get(row.project_id) as any;

    if (!projRow) {
      return {
        id: row.wishlist_id,
        wishlistId: row.wishlist_id,
        projectId: row.project_id,
        isUnavailable: true,
        title: 'Project Unavailable or Archived',
        summary: 'This project is currently unavailable or has been archived by the department.',
        savedAt: row.saved_at,
      };
    }

    const formatted = formatProjectRecord(projRow);
    return {
      ...formatted,
      wishlistId: row.wishlist_id,
      savedAt: row.saved_at,
      isUnavailable: false,
    };
  });
}

/**
 * Returns a simple set of saved project IDs for the student.
 * Useful for fast frontend checking of saved state on cards.
 */
export function getWishlistProjectIds(userId: string): string[] {
  const rows = db.prepare(`
    SELECT project_id 
    FROM wishlists 
    WHERE user_id = ?
  `).all(userId) as any[];

  return rows.map((r) => r.project_id);
}

/**
 * Adds a published project to the student's personal wishlist.
 * Enforces one entry per student and project.
 * Does NOT alter project owner, group membership, or submission limits.
 */
export function addToWishlist(userId: string, projectId: string) {
  // Validate project exists and is approved
  const project = db.prepare(`
    SELECT id, title, status 
    FROM projects 
    WHERE id = ?
  `).get(projectId) as any;

  if (!project) {
    throw new Error('Project not found.');
  }

  if (project.status !== 'approved') {
    throw new Error('Only approved, published projects can be saved to wishlist.');
  }

  // Check if already in wishlist
  const existing = db.prepare(`
    SELECT id FROM wishlists 
    WHERE user_id = ? AND project_id = ?
  `).get(userId, projectId);

  if (existing) {
    return {
      success: true,
      alreadySaved: true,
      message: 'Project is already in your wishlist.',
      projectId,
    };
  }

  const id = `wsh-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO wishlists (id, user_id, project_id, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, userId, projectId, now);

  return {
    success: true,
    alreadySaved: false,
    message: 'Project added to your wishlist.',
    projectId,
    wishlistId: id,
  };
}

/**
 * Removes a project bookmark from the student's wishlist.
 * Removes ONLY the bookmark entry, never the actual project.
 */
export function removeFromWishlist(userId: string, projectIdOrWishlistId: string) {
  const info = db.prepare(`
    DELETE FROM wishlists 
    WHERE user_id = ? AND (project_id = ? OR id = ?)
  `).run(userId, projectIdOrWishlistId, projectIdOrWishlistId);

  return {
    success: true,
    removedCount: info.changes,
    message: info.changes > 0 ? 'Project removed from wishlist.' : 'Project was not in wishlist.',
  };
}
