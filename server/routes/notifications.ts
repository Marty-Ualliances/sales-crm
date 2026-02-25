import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    const userRole = req.user!.role;

    // SDR and leadgen users only see their own notifications
    if (userRole === 'sdr' || userRole === 'leadgen') {
      filter.userId = req.user!.id;
    }
    // admin and hr see all notifications

    const notifications = await Notification.find(filter).sort({ timestamp: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', auth, async (req: AuthRequest, res: Response) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', auth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { read: false };
    const userRole = req.user!.role;

    // Non-admin users only mark their own as read
    if (userRole === 'sdr' || userRole === 'leadgen') {
      filter.userId = req.user!.id;
    }

    await Notification.updateMany(filter, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
