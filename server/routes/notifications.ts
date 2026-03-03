import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const canSeeAll = req.user!.role === 'admin' || req.user!.role === 'manager' || req.user!.role === 'hr';

    let filter = {};
    if (!canSeeAll) {
      filter = { userId: req.user!.id };
    }
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/read-all — MUST be before /:id/read to avoid route shadowing
router.put('/read-all', auth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { isRead: false };
    const userRole = req.user!.role;

    // Non-admin users only mark their own as read
    if (userRole === 'sdr' || userRole === 'lead_gen' || userRole === 'closer') {
      filter.userId = req.user!.id;
    }

    await Notification.updateMany(filter, { isRead: true, readAt: new Date() });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/:id/read — ownership-scoped
router.put('/:id/read', auth, async (req: AuthRequest, res: Response) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
