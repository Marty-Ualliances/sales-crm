import { Router, Response } from 'express';
import User from '../models/User';
import Call from '../models/Call';
import Lead from '../models/Lead';
import { auth, adminOnly, AuthRequest } from '../middleware/auth';
import { sendWelcomeEmail } from '../services/email';

const router = Router();

// GET /api/agents — all authenticated users can see the team roster
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const canSeeStats = userRole === 'admin' || userRole === 'hr';

    const users = await User.find().sort({ name: 1 });

    if (canSeeStats) {
      // Bulk aggregation to avoid N+1 per-agent queries
      const [callStats, leadAssigned, wonStats, pendingFollowUps, completedCalls] = await Promise.all([
        Call.aggregate([
          { $group: { _id: '$agentName', callsMade: { $sum: 1 } } },
        ]),
        Lead.aggregate([
          { $group: { _id: '$assignedAgent', leadsAssigned: { $sum: 1 } } },
        ]),
        Lead.aggregate([
          { $match: { status: 'Closed Won' } },
          { $group: { _id: '$closedBy', leadsWon: { $sum: 1 }, revenueClosed: { $sum: { $ifNull: ['$revenue', 0] } } } },
        ]),
        Lead.aggregate([
          { $match: { nextFollowUp: { $ne: null }, status: { $nin: ['Closed Won', 'Closed Lost'] } } },
          { $group: { _id: '$assignedAgent', count: { $sum: 1 } } },
        ]),
        Call.aggregate([
          { $match: { status: 'Completed' } },
          { $group: { _id: '$agentName', count: { $sum: 1 } } },
        ]),
      ]);

      // Build lookup maps
      const callMap = new Map(callStats.map((c: any) => [c._id, c.callsMade]));
      const assignedMap = new Map(leadAssigned.map((l: any) => [l._id, l.leadsAssigned]));
      const wonMap = new Map(wonStats.map((w: any) => [w._id, { leadsWon: w.leadsWon, revenueClosed: w.revenueClosed }]));
      const pendingMap = new Map(pendingFollowUps.map((p: any) => [p._id, p.count]));
      const completedMap = new Map(completedCalls.map((c: any) => [c._id, c.count]));

      const agents = users.map((user) => {
        const u = user.toJSON();
        const callsMade = callMap.get(u.name) || 0;
        const leadsAssigned = assignedMap.get(u.name) || 0;
        const won = wonMap.get(u.name) || { leadsWon: 0, revenueClosed: 0 };
        const conversionRate = leadsAssigned > 0 ? Math.round((won.leadsWon / leadsAssigned) * 100) : 0;
        const followUpsPending = pendingMap.get(u.name) || 0;
        const followUpsCompleted = completedMap.get(u.name) || 0;

        return {
          ...u,
          callsMade,
          leadsAssigned,
          revenueClosed: won.revenueClosed,
          conversionRate,
          followUpsPending,
          followUpsCompleted,
        };
      });

      res.json(agents);
    } else {
      // SDR & leadgen: basic roster + stats for current user only (5 queries total, not N*5)
      const currentUserDoc = users.find((u) => u._id.toString() === req.user!.id);
      const currentName = currentUserDoc?.name || '';

      const [callsMade, leadsAssigned, leadsWon, pendingCount, completedCount] = await Promise.all([
        Call.countDocuments({ agentName: currentName }),
        Lead.countDocuments({ assignedAgent: currentName }),
        Lead.countDocuments({ closedBy: currentName, status: 'Closed Won' }),
        Lead.countDocuments({
          assignedAgent: currentName,
          nextFollowUp: { $ne: null },
          status: { $nin: ['Closed Won', 'Closed Lost'] },
        }),
        Call.countDocuments({ agentName: currentName, status: 'Completed' }),
      ]);

      const conversionRate = leadsAssigned > 0 ? Math.round((leadsWon / leadsAssigned) * 100) : 0;

      const agents = users.map((user) => {
        const u = user.toJSON();
        const userId = user._id.toString();

        if (userId === req.user!.id) {
          return {
            ...u,
            callsMade,
            leadsAssigned,
            followUpsPending: pendingCount,
            followUpsCompleted: completedCount,
            conversionRate,
          };
        }

        return { id: userId, name: u.name, email: u.email, avatar: u.avatar, role: u.role };
      });

      res.json(agents);
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/agents/:id — admin/HR see any profile, others see only their own
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const canSeeOthers = userRole === 'admin' || userRole === 'hr';

    // Non-admin/HR can only view their own profile
    if (!canSeeOthers && req.params.id !== req.user?.id) {
      return res.status(403).json({ error: 'You can only view your own profile' });
    }

    const agent = await User.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const u = agent.toJSON();

    // Compute real-time KPI metrics in parallel
    const [callsMade, leadsAssigned, leadsWon, revenueAgg, pendingCount, followUpsCompleted] = await Promise.all([
      Call.countDocuments({ agentName: u.name }),
      Lead.countDocuments({ assignedAgent: u.name }),
      Lead.countDocuments({ closedBy: u.name, status: 'Closed Won' }),
      Lead.aggregate([
        { $match: { closedBy: u.name, status: 'Closed Won' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$revenue', 0] } } } },
      ]),
      Lead.countDocuments({
        assignedAgent: u.name,
        nextFollowUp: { $ne: null },
        status: { $nin: ['Closed Won', 'Closed Lost'] },
      }),
      Call.countDocuments({ agentName: u.name, status: 'Completed' }),
    ]);

    const revenueClosed = revenueAgg[0]?.total || 0;
    const conversionRate = leadsAssigned > 0 ? Math.round((leadsWon / leadsAssigned) * 100) : 0;

    res.json({
      ...u,
      callsMade,
      leadsAssigned,
      revenueClosed,
      conversionRate,
      followUpsPending: pendingCount,
      followUpsCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/agents — create new agent (admin only)
router.post('/', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const validRoles = ['admin', 'sdr', 'hr', 'leadgen'];
    const sanitizedRole = validRoles.includes(role) ? role : 'sdr';

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Pass plain password — User model pre-save hook handles hashing
    const newAgent = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: password,
      role: sanitizedRole,
      avatar: trimmedName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    });

    // Send welcome email with credentials (non-blocking)
    sendWelcomeEmail(trimmedEmail, trimmedName, password, sanitizedRole).catch((err) => {
      console.error('Welcome email failed (non-blocking):', err);
    });

    res.status(201).json(newAgent.toJSON());
  } catch (err: any) {
    console.error('Create agent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/agents/:id — admin only
router.put('/:id', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    // Whitelist allowed fields to prevent mass assignment
    const ALLOWED_AGENT_FIELDS = ['name', 'email', 'role', 'avatar'];
    const updates: Record<string, any> = {};
    for (const key of ALLOWED_AGENT_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const agent = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/agents/:id — admin only
router.delete('/:id', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const agent = await User.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ message: 'Agent deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
