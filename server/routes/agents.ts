import { Router, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/email.js';

const router = Router();

// GET /api/agents — all authenticated users can see the team roster
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    // For now, allow everyone to see basic stats. A true restriction could be checked via checkPermission('users', 'view_all').
    const canSeeStats = userRole === 'admin' || userRole === 'hr' || userRole === 'manager' || userRole === 'lead_gen';

    const users = await User.find({ isActive: { $ne: false } }).sort({ name: 1 });

    if (canSeeStats) {
      const [callStats, leadAssigned, wonStats, pendingFollowUps] = await Promise.all([
        Activity.aggregate([
          { $match: { type: 'call' } },
          { $group: { _id: '$userId', callsMade: { $sum: 1 } } }
        ]),
        Lead.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: '$assignedTo', leadsAssigned: { $sum: 1 } } }
        ]),
        Lead.aggregate([
          { $match: { status: 'won', isDeleted: false } },
          { $group: { _id: '$assignedTo', leadsWon: { $sum: 1 }, revenueClosed: { $sum: { $ifNull: ['$dealValue', 0] } } } }
        ]),
        Activity.aggregate([
          { $match: { type: 'follow_up', isCompleted: false } },
          { $group: { _id: '$userId', count: { $sum: 1 } } }
        ])
      ]);

      const callMap = new Map(callStats.map((c: any) => [c._id?.toString(), c.callsMade]));
      const assignedMap = new Map(leadAssigned.map((l: any) => [l._id?.toString(), l.leadsAssigned]));
      const wonMap = new Map(wonStats.map((w: any) => [w._id?.toString(), { leadsWon: w.leadsWon, revenueClosed: w.revenueClosed }]));
      const pendingMap = new Map(pendingFollowUps.map((p: any) => [p._id?.toString(), p.count]));

      const agents = users.map((user) => {
        const u = user.toJSON();
        const strId = user._id.toString();
        const callsMade = callMap.get(strId) || 0;
        const leadsAssigned = assignedMap.get(strId) || 0;
        const won = wonMap.get(strId) || { leadsWon: 0, revenueClosed: 0 };
        const conversionRate = leadsAssigned > 0 ? Math.round((won.leadsWon / leadsAssigned) * 100) : 0;
        const followUpsPending = pendingMap.get(strId) || 0;

        return {
          ...u,
          callsMade,
          leadsAssigned,
          leadsWon: won.leadsWon,
          revenueClosed: won.revenueClosed,
          conversionRate,
          followUpsPending,
        };
      });

      res.json(agents);
    } else {
      // Basic roster
      const currentUserDoc = users.find((u) => u._id.toString() === req.user!.id);

      const currentId = req.user!.id;
      const objectId = new mongoose.Types.ObjectId(currentId);

      const [callsMade, leadsAssigned, leadsWon, pendingCount] = await Promise.all([
        Activity.countDocuments({ userId: objectId, type: 'call' }),
        Lead.countDocuments({ assignedTo: objectId, isDeleted: false }),
        Lead.countDocuments({ assignedTo: objectId, status: 'won', isDeleted: false }),
        Activity.countDocuments({ userId: objectId, type: 'follow_up', isCompleted: false }),
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
            leadsWon,
            followUpsPending: pendingCount,
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

// GET /api/agents/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const canSeeOthers = userRole === 'admin' || userRole === 'hr' || userRole === 'manager';

    if (!canSeeOthers && req.params.id !== req.user?.id) {
      return res.status(403).json({ error: 'You can only view your own profile' });
    }

    const agent = await User.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const u = agent.toJSON();
    const objectId = agent._id;

    const [callsMade, leadsAssigned, leadsWon, revenueAgg, pendingCount] = await Promise.all([
      Activity.countDocuments({ userId: objectId, type: 'call' }),
      Lead.countDocuments({ assignedTo: objectId, isDeleted: false }),
      Lead.countDocuments({ assignedTo: objectId, status: 'won', isDeleted: false }),
      Lead.aggregate([
        { $match: { assignedTo: objectId, status: 'won', isDeleted: false } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$dealValue', 0] } } } },
      ]),
      Activity.countDocuments({ userId: objectId, type: 'follow_up', isCompleted: false }),
    ]);

    const revenueClosed = revenueAgg[0]?.total || 0;
    const conversionRate = leadsAssigned > 0 ? Math.round((leadsWon / leadsAssigned) * 100) : 0;

    res.json({
      ...u,
      callsMade,
      leadsAssigned,
      leadsWon,
      revenueClosed,
      conversionRate,
      followUpsPending: pendingCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/agents — create new agent
router.post('/', authenticateToken, checkPermission('users', 'manage'), async (req: AuthRequest, res: Response) => {
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

    const validRoles = ['admin', 'manager', 'sdr', 'closer', 'hr', 'lead_gen'];
    const sanitizedRole = validRoles.includes(role) ? role : 'sdr';

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newAgent = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: password,
      role: sanitizedRole,
      avatar: trimmedName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    });

    sendWelcomeEmail(trimmedEmail, trimmedName, password, sanitizedRole).catch((err) => {
      console.error('Welcome email failed (non-blocking):', err);
    });

    res.status(201).json(newAgent.toJSON());
  } catch (err: any) {
    console.error('Create agent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/agents/:id
router.put('/:id', authenticateToken, checkPermission('users', 'manage'), async (req: AuthRequest, res: Response) => {
  try {
    const ALLOWED_AGENT_FIELDS = ['name', 'email', 'role', 'phone', 'isActive', 'team'];
    const updates: Record<string, any> = {};
    for (const key of ALLOWED_AGENT_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Attempt to correctly format standard arrays / names
    if (updates.name) {
      updates.avatar = updates.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }

    const agent = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/agents/:id — soft-delete (deactivate) agent
router.delete('/:id', authenticateToken, checkPermission('users', 'manage'), async (req: AuthRequest, res: Response) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const agent = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ message: 'Agent deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
