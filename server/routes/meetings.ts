import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Meeting from '../models/Meeting';
import User from '../models/User';
import { getIO } from '../socket';

const router = Router();

function emitMeetingChange(action: string, data?: any) {
  try {
    getIO().emit('lead:changed', { action: `meeting-${action}`, ...(data || {}) });
  } catch (_) { }
}

// GET /api/meetings — list all meetings (admin/leadgen see all; sdr sees own)
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    let filter: any = {};
    if (role === 'sdr') {
      filter.createdBy = req.user!.id;
    }
    // Admin and leadgen see all meetings
    const meetings = await Meeting.find(filter).sort({ date: -1, time: -1 }).lean();
    res.json(meetings.map((m: any) => ({ ...m, id: m._id.toString() })));
  } catch (err) {
    console.error('List meetings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/meetings — create a meeting
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, date, time, duration, leadId, leadName, attendees } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ error: 'Title, date, and time are required' });
    }

    const user = await User.findById(req.user!.id);
    const meeting = await Meeting.create({
      title: String(title).trim(),
      description: description || '',
      date: new Date(date),
      time,
      duration: duration || 30,
      leadId: leadId || null,
      leadName: leadName || '',
      createdBy: req.user!.id,
      createdByName: user?.name || '',
      attendees: attendees || [],
      status: 'scheduled',
    });

    emitMeetingChange('created', { id: meeting._id });
    res.status(201).json(meeting.toJSON());
  } catch (err) {
    console.error('Create meeting error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/meetings/:id — update a meeting
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    // Only creator or admin can update
    if (meeting.createdBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allowed = ['title', 'description', 'date', 'time', 'duration', 'leadId', 'leadName', 'attendees', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'date') {
          (meeting as any)[key] = new Date(req.body[key]);
        } else {
          (meeting as any)[key] = req.body[key];
        }
      }
    }

    await meeting.save();
    emitMeetingChange('updated', { id: meeting._id });
    res.json(meeting.toJSON());
  } catch (err) {
    console.error('Update meeting error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/meetings/:id — delete a meeting
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    // Only creator or admin can delete
    if (meeting.createdBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    emitMeetingChange('deleted', { id: req.params.id });
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    console.error('Delete meeting error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
