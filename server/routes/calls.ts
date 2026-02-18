import { Router, Response } from 'express';
import Call from '../models/Call';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/calls
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const filter: any = {};

    if (req.user!.role === 'sdr') {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user!.id);
      if (user) filter.agentName = user.name;
    }

    if (status && status !== 'all') filter.status = status;
    if (search) {
      const s = String(search);
      filter.$or = [
        { leadName: { $regex: s, $options: 'i' } },
        { notes: { $regex: s, $options: 'i' } },
      ];
    }

    const calls = await Call.find(filter).sort({ date: -1 });
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/calls/:id
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });
    res.json(call);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/calls
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const call = new Call(req.body);
    await call.save();
    res.status(201).json(call);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
