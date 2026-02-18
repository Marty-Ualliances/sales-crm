import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { auth, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/agents — admin only
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const agents = await User.find().sort({ name: 1 });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/agents/:id
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const agent = await User.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
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

    const validRoles = ['admin', 'sdr'];
    const sanitizedRole = validRoles.includes(role) ? role : 'sdr';

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAgent = new User({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      role: sanitizedRole,
      avatar: trimmedName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      leadsAssigned: 0,
      callsMade: 0,
      followUpsCompleted: 0,
      followUpsPending: 0,
      conversionRate: 0,
      revenueClosed: 0,
    });

    await newAgent.save();
    const { password: _, ...agentData } = newAgent.toJSON();
    res.status(201).json(agentData);
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
