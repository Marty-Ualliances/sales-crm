import { Router, Response } from 'express';
import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/activities — create a new activity
// ════════════════════════════════════════════════════════════════════════════════
router.post('/', authenticateToken, checkPermission('activities', 'create'), async (req: AuthRequest, res: Response) => {
    try {
        const { leadId, type, callDuration, callOutcome, subject, description, scheduledAt, metadata } = req.body;

        if (!leadId) return res.status(400).json({ error: 'leadId is required' });
        if (!type) return res.status(400).json({ error: 'type is required' });

        // Validate lead exists
        const lead = await Lead.findById(leadId);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        // Require callOutcome for call type
        if (type === 'call' && !callOutcome) {
            return res.status(400).json({ error: 'callOutcome is required for call activities' });
        }

        const activity = await Activity.create({
            leadId,
            userId: req.user!.id,
            type,
            callDuration: callDuration || 0,
            callOutcome: type === 'call' ? callOutcome : null,
            subject: subject || '',
            description: description || '',
            scheduledAt: scheduledAt || null,
            metadata: metadata || {},
        });

        // Touch lead's updatedAt
        lead.set('updatedAt', new Date());
        await lead.save();

        const populated = await Activity.findById(activity._id)
            .populate('userId', 'name avatar role')
            .lean();

        res.status(201).json(populated);
    } catch (err) {
        console.error('POST /api/activities error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/activities/feed — latest 50 activities the user can see
// ════════════════════════════════════════════════════════════════════════════════
router.get('/feed', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user!.role;
        let filter: Record<string, any> = {};

        // SDRs/closers only see their own activities
        if (role === 'sdr' || role === 'closer') {
            filter.userId = req.user!.id;
        }

        const activities = await Activity.find(filter)
            .populate('userId', 'name avatar role')
            .populate('leadId', 'firstName lastName company')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json(activities);
    } catch (err) {
        console.error('GET /api/activities/feed error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/activities/my — current user's activities
// ════════════════════════════════════════════════════════════════════════════════
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { type, dateFrom, dateTo, page = '1', limit = '25' } = req.query as Record<string, string>;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, parseInt(limit, 10) || 25);

        const filter: Record<string, any> = { userId: req.user!.id };
        if (type) filter.type = type;
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }

        const [activities, total] = await Promise.all([
            Activity.find(filter)
                .populate('leadId', 'firstName lastName company')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Activity.countDocuments(filter),
        ]);

        res.json({
            activities,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error('GET /api/activities/my error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/activities/my/tasks — pending tasks/follow-ups
// ════════════════════════════════════════════════════════════════════════════════
router.get('/my/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const tasks = await Activity.find({
            userId: req.user!.id,
            type: { $in: ['task', 'follow_up'] },
            isCompleted: false,
        })
            .populate('leadId', 'firstName lastName company phone email')
            .sort({ scheduledAt: 1 })
            .limit(200)
            .lean();

        res.json(tasks);
    } catch (err) {
        console.error('GET /api/activities/my/tasks error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/activities/lead/:leadId — all activities for a lead
// ════════════════════════════════════════════════════════════════════════════════
router.get('/lead/:leadId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { page = '1', limit = '25' } = req.query as Record<string, string>;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, parseInt(limit, 10) || 25);

        // SDRs/closers can only view activities for leads assigned to them
        const role = req.user!.role;
        if (role === 'sdr' || role === 'closer') {
            const Lead = (await import('../models/Lead.js')).default;
            const lead = await Lead.findById(req.params.leadId).select('assignedTo');
            if (lead && lead.assignedTo?.toString() !== req.user!.id) {
                return res.status(403).json({ error: 'Not authorized to view activities for this lead' });
            }
        }

        const filter = { leadId: req.params.leadId };

        const [activities, total] = await Promise.all([
            Activity.find(filter)
                .populate('userId', 'name avatar role')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Activity.countDocuments(filter),
        ]);

        res.json({
            activities,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error('GET /api/activities/lead/:leadId error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// PATCH /api/activities/:id/complete — mark activity as completed
// ════════════════════════════════════════════════════════════════════════════════
router.patch('/:id/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) return res.status(404).json({ error: 'Activity not found' });

        // Owner only
        if (activity.userId.toString() !== req.user!.id) {
            return res.status(403).json({ error: 'Only the activity owner can mark it complete' });
        }

        activity.isCompleted = true;
        activity.completedAt = new Date();
        await activity.save();

        res.json(activity);
    } catch (err) {
        console.error('PATCH /api/activities/:id/complete error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
