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
    const data = { ...req.body };

    // Auto-flag for recording if call >5 minutes
    const durationStr = String(data.duration || '0 min');
    const durationMin = parseInt(durationStr) || 0;
    if (durationMin >= 5) {
      data.recordingFlagged = true;
    }

    // Auto-flag if lead status is positive
    if (data.leadId) {
      const Lead = (await import('../models/Lead')).default;
      const lead = await Lead.findById(data.leadId);
      if (lead && ['Positive', 'Meeting Done', 'Closed'].includes(lead.status)) {
        data.recordingFlagged = true;
      }
    }

    const call = new Call(data);
    await call.save();
    res.status(201).json(call);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/calls/:id/recording — toggle recording status
router.put('/:id/recording', auth, async (req: AuthRequest, res: Response) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    if (req.body.hasRecording !== undefined) call.hasRecording = req.body.hasRecording;
    if (req.body.recordingUrl !== undefined) call.recordingUrl = req.body.recordingUrl;
    if (req.body.recordingFlagged !== undefined) call.recordingFlagged = req.body.recordingFlagged;

    await call.save();
    res.json(call);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/calls/recordings — list only calls with recordings or flagged
router.get('/recordings', auth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { $or: [{ hasRecording: true }, { recordingFlagged: true }] };
    if (req.user!.role === 'sdr') {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user!.id);
      if (user) filter.agentName = user.name;
    }
    const calls = await Call.find(filter).sort({ date: -1 });
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
