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
    console.error('Error retrieving wishlist:', error);
    res.status(500).json({ error: 'Failed to retrieve wishlist. Please try again later.' });
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
    console.error('Error retrieving wishlist IDs:', error);
    res.status(500).json({ error: 'Failed to retrieve wishlist bookmarks. Please try again later.' });
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
    console.error('Error adding to wishlist:', error);
    if (error?.message?.includes('not found')) {
      res.status(404).json({ error: 'Project not found.' });
    } else if (error?.message?.includes('approved')) {
      res.status(400).json({ error: 'Only approved, published projects can be saved to your wishlist.' });
    } else {
      res.status(400).json({ error: 'Failed to add project to wishlist. Please try again.' });
    }
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
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove project from wishlist. Please try again later.' });
  }
});

export default router;
