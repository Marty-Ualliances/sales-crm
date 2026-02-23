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

    if (canSeeStats) {
      // Admin & HR see everything + dynamically computed stats
      const users = await User.find().sort({ name: 1 });

      const agents = await Promise.all(users.map(async (user) => {
        const u = user.toJSON();
        // Compute real-time KPI metrics
        const callsMade = await Call.countDocuments({ agentName: u.name });
        const leadsAssigned = await Lead.countDocuments({ assignedAgent: u.name });
        const leadsWon = await Lead.countDocuments({ closedBy: u.name, status: 'Closed Won' });

        let revenueClosed = 0;
        const wonLeadsRecords = await Lead.find({ closedBy: u.name, status: 'Closed Won' });
        wonLeadsRecords.forEach((l: any) => revenueClosed += (l.revenue || 0));

        const conversionRate = leadsAssigned > 0 ? Math.round((leadsWon / leadsAssigned) * 100) : 0;

        // Count follow-ups (overdue/pending/completed)
        const today = new Date();
        const pendingLeads = await Lead.find({
          assignedAgent: u.name,
          nextFollowUp: { $ne: null },
          status: { $nin: ['Closed Won', 'Closed Lost'] }
        });

        const followUpsPending = pendingLeads.length;
        const followUpsCompleted = await Call.countDocuments({ agentName: u.name, status: 'Completed' }); // Proxied by completed calls

        return {
          ...u,
          callsMade,
          leadsAssigned,
          revenueClosed,
          conversionRate,
          followUpsPending,
          followUpsCompleted
        };
      }));

      res.json(agents);
    } else {
      // SDR & leadgen see basic roster only (name, role, avatar, email)
      const agents = await User.find()
        .select('name email avatar role createdAt')
        .sort({ name: 1 });
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

    // Compute real-time KPI metrics
    const callsMade = await Call.countDocuments({ agentName: u.name });
    const leadsAssigned = await Lead.countDocuments({ assignedAgent: u.name });
    const leadsWon = await Lead.countDocuments({ closedBy: u.name, status: 'Closed Won' });

    let revenueClosed = 0;
    const wonLeadsRecords = await Lead.find({ closedBy: u.name, status: 'Closed Won' });
    wonLeadsRecords.forEach((l: any) => revenueClosed += (l.revenue || 0));

    const conversionRate = leadsAssigned > 0 ? Math.round((leadsWon / leadsAssigned) * 100) : 0;

    const pendingLeads = await Lead.find({
      assignedAgent: u.name,
      nextFollowUp: { $ne: null },
      status: { $nin: ['Closed Won', 'Closed Lost'] }
    });

    const followUpsPending = pendingLeads.length;
    const followUpsCompleted = await Call.countDocuments({ agentName: u.name, status: 'Completed' });

    res.json({
      ...u,
      callsMade,
      leadsAssigned,
      revenueClosed,
      conversionRate,
      followUpsPending,
      followUpsCompleted
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
    const { password, ...updates } = req.body;
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
