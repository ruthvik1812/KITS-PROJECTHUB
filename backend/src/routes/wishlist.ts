import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getUserWishlist,
  getWishlistProjectIds,
  addToWishlist,
  removeFromWishlist,
} from '../services/wishlistService.js';

const router = Router();

// GET /api/wishlist — Get student's private wishlist (Authenticated)
router.get('/', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Please sign in to access your wishlist.' });
      return;
    }

    const items = getUserWishlist(userId);
    res.json({ success: true, count: items.length, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve wishlist.' });
  }
});

// GET /api/wishlist/ids — Get array of bookmarked project IDs for instant UI state
router.get('/ids', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      res.json({ projectIds: [] });
      return;
    }

    const projectIds = getWishlistProjectIds(userId);
    res.json({ success: true, projectIds });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve wishlist IDs.' });
  }
});

// POST /api/wishlist/:projectId — Save published project to student's wishlist
router.post('/:projectId', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    const { projectId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Please sign in to save projects to your wishlist.' });
      return;
    }

    if (!projectId) {
      res.status(400).json({ error: 'Missing projectId.' });
      return;
    }

    const result = addToWishlist(userId, projectId);
    res.json(result);
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message || 'Failed to add project to wishlist.' });
  }
});

// DELETE /api/wishlist/:projectId — Remove project bookmark from student's wishlist
router.delete('/:projectId', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    const { projectId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Please sign in to update your wishlist.' });
      return;
    }

    if (!projectId) {
      res.status(400).json({ error: 'Missing projectId.' });
      return;
    }

    const result = removeFromWishlist(userId, projectId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove project from wishlist.' });
  }
});

export default router;
