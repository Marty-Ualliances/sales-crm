import { Router, Response } from 'express';
import Lead from '../models/Lead';
import Call from '../models/Call';
import User from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware: only HR and admin can access
function hrAccess(req: AuthRequest, res: Response, next: any) {
  if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'HR access required' });
  }
  next();
}

// GET /api/hr/dashboard — HR dashboard stats
router.get('/dashboard', auth, hrAccess, async (_req: AuthRequest, res: Response) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const closedLeads = await Lead.countDocuments({ status: 'Closed Won' });
    const lostLeads = await Lead.countDocuments({ status: 'Closed Lost' });
    const activeLeads = totalLeads - closedLeads - lostLeads;
    const totalCalls = await Call.countDocuments();
    const agents = await User.find({ role: 'sdr' }).select('name callsMade leadsAssigned revenueClosed');

    // Agent performance summary
    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const leadsAdded = await Lead.countDocuments({ addedBy: agent.name });
        const callsMade = await Call.countDocuments({ agentName: agent.name });
        const leadsClosed = await Lead.countDocuments({ closedBy: agent.name });
        const leadsAssigned = await Lead.countDocuments({ assignedAgent: agent.name });
        return {
          id: agent._id.toString(),
          name: agent.name,
          leadsAdded,
          leadsAssigned,
          callsMade,
          leadsClosed,
        };
      })
    );

    res.json({
      totalLeads,
      closedLeads,
      lostLeads,
      activeLeads,
      totalCalls,
      agentPerformance,
    });
  } catch (err) {
    console.error('HR dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hr/leads — all leads with addedBy, call agents, closedBy tracking
router.get('/leads', auth, hrAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, agent } = req.query;
    const filter: any = {};

    if (status && status !== 'all') filter.status = status;
    if (agent) {
      filter.$or = [
        { addedBy: agent },
        { assignedAgent: agent },
        { closedBy: agent },
      ];
    }
    if (search) {
      const s = String(search);
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { companyName: { $regex: s, $options: 'i' } },
        { addedBy: { $regex: s, $options: 'i' } },
        { closedBy: { $regex: s, $options: 'i' } },
        { assignedAgent: { $regex: s, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(filter).sort({ lastActivity: -1 });

    // For each lead, find agents who made calls on that lead
    const leadsWithCallAgents = await Promise.all(
      leads.map(async (lead) => {
        const calls = await Call.find({ leadId: lead._id.toString() }).select('agentName date duration status');
        const callAgents = [...new Set(calls.map(c => c.agentName))];
        const leadObj = lead.toJSON();
        return {
          ...leadObj,
          callAgents,
          callHistory: calls.map(c => c.toJSON()),
        };
      })
    );

    res.json(leadsWithCallAgents);
  } catch (err) {
    console.error('HR leads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hr/closed-leads — only closed leads with full detail
router.get('/closed-leads', auth, hrAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { search, agent } = req.query;
    const filter: any = { status: { $in: ['Closed Won', 'Closed Lost'] } };

    if (agent) {
      filter.$or = [
        { closedBy: agent },
        { assignedAgent: agent },
      ];
    }
    if (search) {
      const s = String(search);
      filter.$and = [
        {
          $or: [
            { name: { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
            { companyName: { $regex: s, $options: 'i' } },
            { closedBy: { $regex: s, $options: 'i' } },
            { addedBy: { $regex: s, $options: 'i' } },
          ],
        },
      ];
    }

    const leads = await Lead.find(filter).sort({ closedAt: -1, lastActivity: -1 });

    const leadsWithDetails = await Promise.all(
      leads.map(async (lead) => {
        const calls = await Call.find({ leadId: lead._id.toString() }).select('agentName date duration status notes');
        const callAgents = [...new Set(calls.map(c => c.agentName))];
        const leadObj = lead.toJSON();
        return {
          ...leadObj,
          callAgents,
          totalCalls: calls.length,
          callHistory: calls.map(c => c.toJSON()),
        };
      })
    );

    res.json(leadsWithDetails);
  } catch (err) {
    console.error('HR closed-leads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
