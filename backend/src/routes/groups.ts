import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createOfficialGroup,
  inviteMemberToGroup,
  acceptGroupInvitation,
  declineGroupInvitation,
  getPendingInvitesByUserId,
  getGroupById,
  getGroupByUserId
} from '../services/groupSqlService.js';
import { sanitizeClientErrorMessage } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/groups
 * Authenticated: Create an official student group (4-6 members).
 * Leader ID is derived strictly from verified session token.
 */
router.post('/', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, departmentId, academicYear, members } = req.body;

    if (!name || !name.trim() || !departmentId) {
      res.status(400).json({ error: 'Missing required group parameters (group name, department).' });
      return;
    }

    const group = createOfficialGroup({
      leaderId: user.id,
      name: name.trim(),
      departmentId,
      academicYear: academicYear || '2026-2027',
      members
    });

    res.status(201).json(group);
  } catch (err: any) {
    console.error('Error creating group:', err);
    res.status(400).json({ error: sanitizeClientErrorMessage(err, 'Failed to create group. Please check roll numbers and try again.') });
  }
});

/**
 * GET /api/groups/my-group
 * Authenticated: Returns the confirmed group for the calling user.
 * Only returns a group if the student has accepted membership.
 */
router.get('/my-group', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const group = getGroupByUserId(user.id, user.student_roll_number || undefined);
    res.json(group || null);
  } catch (err: any) {
    console.error('Error fetching user group:', err);
    res.status(500).json({ error: 'Failed to retrieve group information. Please try again later.' });
  }
});

/**
 * GET /api/groups/pending-invites
 * Authenticated: Returns all pending group invitations for the calling user.
 */
router.get('/pending-invites', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const invites = getPendingInvitesByUserId(user.id);
    res.json({ invites });
  } catch (err: any) {
    console.error('Error fetching pending invites:', err);
    res.status(500).json({ error: 'Failed to retrieve invitations. Please try again later.' });
  }
});

/**
 * GET /api/groups/:id
 * Public: view group details and member roster
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const group = getGroupById(req.params.id);
    if (!group) {
      res.status(404).json({ error: 'Official group not found' });
      return;
    }
    res.json(group);
  } catch (err: any) {
    console.error('Error fetching group details:', err);
    res.status(500).json({ error: 'Failed to retrieve group details. Please try again later.' });
  }
});

/**
 * POST /api/groups/:id/invite
 * Authenticated: Team leader invites a registered student by roll number.
 * Invited student gets invite_status = 'pending' until they accept.
 */
router.post('/:id/invite', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentRollNumber } = req.body;

    if (!studentRollNumber || !studentRollNumber.trim()) {
      res.status(400).json({ error: 'Student roll number is required to invite a member.' });
      return;
    }

    const updated = inviteMemberToGroup(req.params.id, user.id, studentRollNumber.trim());
    res.json(updated);
  } catch (err: any) {
    console.error('Error inviting member:', err);
    res.status(400).json({ error: sanitizeClientErrorMessage(err, 'Failed to invite member. Please check student roll number.') });
  }
});

/**
 * POST /api/groups/:id/accept
 * Authenticated: Student accepts a pending group invitation.
 * Only after accepting does the student gain access to the group project.
 */
router.post('/:id/accept', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = acceptGroupInvitation(req.params.id, user.id);
    res.json(updated);
  } catch (err: any) {
    console.error('Error accepting invitation:', err);
    res.status(400).json({ error: sanitizeClientErrorMessage(err, 'Failed to accept invitation. Please try again.') });
  }
});

/**
 * POST /api/groups/:id/decline
 * Authenticated: Student declines a pending group invitation.
 */
router.post('/:id/decline', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = declineGroupInvitation(req.params.id, user.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error declining invitation:', err);
    res.status(400).json({ error: sanitizeClientErrorMessage(err, 'Failed to decline invitation. Please try again.') });
  }
});

export default router;
