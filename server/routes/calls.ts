import { Router, Response } from 'express';
import Call from '../models/Call';
import { auth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

/** Escape special regex characters to prevent ReDoS */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Allowed fields for call creation to prevent mass assignment */
const CALL_WRITABLE_FIELDS = [
  'leadId', 'leadName', 'agentName', 'date', 'time', 'duration',
  'status', 'notes', 'hasRecording', 'recordingUrl', 'recordingFlagged',
];

// GET /api/calls/recordings — MUST be before /:id to avoid route shadowing
router.get('/recordings', auth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { $or: [{ hasRecording: true }, { recordingFlagged: true }] };
    if (req.user!.role === 'sdr') {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user!.id);
      if (user) filter.agentName = user.name;
    }
    const calls = await Call.find(filter).sort({ date: -1 }).limit(500);
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/calls
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const filter: Record<string, any> = {};

    if (req.user!.role === 'sdr') {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user!.id);
      if (user) filter.agentName = user.name;
    }

    if (status && status !== 'all') filter.status = status;
    if (search) {
      const s = escapeRegex(String(search));
      filter.$or = [
        { leadName: { $regex: s, $options: 'i' } },
        { notes: { $regex: s, $options: 'i' } },
      ];
    }

    const calls = await Call.find(filter).sort({ date: -1 }).limit(500);
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
    // Whitelist allowed fields to prevent mass assignment
    const data: Record<string, any> = {};
    for (const key of CALL_WRITABLE_FIELDS) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    if (req.user!.role !== 'admin') {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user!.id);
      if (user) data.agentName = user.name;
    }

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
      if (lead && ['Meeting Completed', 'Negotiation', 'Closed Won', 'Active Account'].includes(lead.status)) {
        data.recordingFlagged = true;
      }
    }

    const call = new Call(data);
    await call.save();

    // Auto-update lead stats when a call is logged
    if (data.leadId) {
      const Lead = (await import('../models/Lead')).default;
      const Activity = (await import('../models/Activity')).default;
      const lead = await Lead.findById(data.leadId);
      if (lead) {
        // Promote status to 'Contacted' if the lead is still 'New Lead' or 'In Progress'
        if (lead.status === 'New Lead' || lead.status === 'In Progress') {
          lead.status = 'Contacted' as any;
        }
        lead.set('updatedAt', new Date());
        await lead.save();

        await Activity.create({
          leadId: lead._id,
          userId: req.user!.id,
          type: 'call',
          callDuration: durationMin,
          callOutcome: data.status === 'Completed' ? 'connected' : 'no_answer',
          description: data.notes || 'Call logged',
        });

        // Emit real-time update so dashboards refresh immediately
        try {
          const { emitLeadChangedToRoles } = await import('../socket');
          emitLeadChangedToRoles('updated', {
            leadId: lead._id.toString(),
            assignedUserId: lead.assignedTo?.toString(),
          });
        } catch {
          // socket not critical
        }
      }
    }

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

const updateCallSchema = z.object({
  status: z.enum(['Completed', 'Missed', 'Follow-up']).optional(),
  notes: z.string().optional(),
  duration: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  hasRecording: z.boolean().optional(),
  recordingUrl: z.string().optional(),
  recordingFlagged: z.boolean().optional(),
});

// PUT /api/calls/:id — update call details
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    // Ensure users can only update their own calls, unless they are admin/hr/leadgen
    if (req.user!.role === 'sdr') {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user!.id);
      if (user && call.agentName !== user.name) {
        return res.status(403).json({ error: 'Not authorized to update this call' });
      }
    }

    const parsed = updateCallSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
    }
    const updates = parsed.data;

    if (updates.date) call.date = new Date(updates.date);
    if (updates.time !== undefined) call.time = updates.time;
    if (updates.status !== undefined) call.status = updates.status;
    if (updates.notes !== undefined) call.notes = updates.notes;
    if (updates.duration !== undefined) call.duration = updates.duration;
    if (updates.hasRecording !== undefined) call.hasRecording = updates.hasRecording;
    if (updates.recordingUrl !== undefined) call.recordingUrl = updates.recordingUrl;
    if (updates.recordingFlagged !== undefined) call.recordingFlagged = updates.recordingFlagged;

    await call.save();
    res.json(call);
  } catch (err) {
    console.error('Update call error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
