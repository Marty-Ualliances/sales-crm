import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    // Optionally filter by userId
    if (req.user!.role === 'sdr') {
      filter.$or = [{ userId: req.user!.id }, { userId: { $exists: false } }];
    }
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
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
