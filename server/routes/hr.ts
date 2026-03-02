import { Router, Response } from 'express';
import Lead from '../models/Lead';
import Call from '../models/Call';
import User from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

/** Escape special regex characters to prevent ReDoS */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Middleware: only HR and admin can access
function hrAccess(req: AuthRequest, res: Response, next: any) {
  if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'HR access required' });
  }
  next();
}

// GET /api/hr/dashboard — HR dashboard stats
router.get('/dashboard', auth, hrAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { timeRange } = req.query;

    // Build date filter based on timeRange
    const dateFilter: Record<string, any> = {};
    if (timeRange && timeRange !== 'allTime') {
      const now = new Date();
      let startDate = new Date();
      if (timeRange === 'last7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'last30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === 'thisMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      dateFilter.createdAt = { $gte: startDate };
    }

    const totalLeadsQuery = { ...dateFilter };
    const closedLeadsQuery = { status: 'Closed Won', ...dateFilter };
    const lostLeadsQuery = { status: 'Closed Lost', ...dateFilter };
    const totalCallsQuery = { ...dateFilter };

    const totalLeads = await Lead.countDocuments(totalLeadsQuery);
    const closedLeads = await Lead.countDocuments(closedLeadsQuery);
    const lostLeads = await Lead.countDocuments(lostLeadsQuery);
    const activeLeads = totalLeads - closedLeads - lostLeads;
    const totalCalls = await Call.countDocuments(totalCallsQuery);
    const agents = await User.find({ role: 'sdr' }).select('name');

    // Bulk aggregation for agent performance to avoid N+1 queries
    const agentNames = agents.map((a) => a.name);

    const [leadsAddedAgg, callsMadeAgg, leadsClosedAgg, leadsAssignedAgg] = await Promise.all([
      Lead.aggregate([
        { $match: { addedBy: { $in: agentNames }, ...dateFilter } },
        { $group: { _id: '$addedBy', count: { $sum: 1 } } },
      ]),
      Call.aggregate([
        { $match: { agentName: { $in: agentNames }, ...dateFilter } },
        { $group: { _id: '$agentName', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: { closedBy: { $in: agentNames }, ...dateFilter } },
        { $group: { _id: '$closedBy', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: { assignedAgent: { $in: agentNames }, ...dateFilter } },
        { $group: { _id: '$assignedAgent', count: { $sum: 1 } } },
      ]),
    ]);

    const addedMap = new Map(leadsAddedAgg.map((r: any) => [r._id, r.count]));
    const callsMap = new Map(callsMadeAgg.map((r: any) => [r._id, r.count]));
    const closedMap = new Map(leadsClosedAgg.map((r: any) => [r._id, r.count]));
    const assignedMap = new Map(leadsAssignedAgg.map((r: any) => [r._id, r.count]));

    const agentPerformance = agents.map((agent) => ({
      id: agent._id.toString(),
      name: agent.name,
      leadsAdded: addedMap.get(agent.name) || 0,
      leadsAssigned: assignedMap.get(agent.name) || 0,
      callsMade: callsMap.get(agent.name) || 0,
      leadsClosed: closedMap.get(agent.name) || 0,
    }));

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
    const filter: Record<string, any> = {};

    if (status && status !== 'all') filter.status = status;
    if (agent) {
      filter.$or = [
        { addedBy: agent },
        { assignedAgent: agent },
        { closedBy: agent },
      ];
    }
    if (search) {
      const s = escapeRegex(String(search));
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { companyName: { $regex: s, $options: 'i' } },
        { addedBy: { $regex: s, $options: 'i' } },
        { closedBy: { $regex: s, $options: 'i' } },
        { assignedAgent: { $regex: s, $options: 'i' } },
      ];
    }

    // Paginate to prevent unbounded queries
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '200'), 10) || 200));
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ lastActivity: -1 }).skip(skip).limit(limit),
      Lead.countDocuments(filter),
    ]);

    // Bulk query all calls for these leads to avoid N+1
    const leadIds = leads.map((l) => l._id.toString());
    const allCalls = await Call.find({ leadId: { $in: leadIds } }).select('agentName date duration status leadId');

    // Group calls by leadId
    const callsByLead = new Map<string, typeof allCalls>();
    for (const call of allCalls) {
      const key = (call as any).leadId;
      if (!callsByLead.has(key)) callsByLead.set(key, []);
      callsByLead.get(key)!.push(call);
    }

    const leadsWithCallAgents = leads.map((lead) => {
      const leadId = lead._id.toString();
      const calls = callsByLead.get(leadId) || [];
      const callAgents = Array.from(new Set(calls.map((c) => c.agentName)));
      const leadObj = lead.toJSON();
      return {
        ...leadObj,
        callAgents,
        callHistory: calls.map((c) => c.toJSON()),
      };
    });

    res.json({ leads: leadsWithCallAgents, total, page, limit });
  } catch (err) {
    console.error('HR leads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hr/closed-leads — only closed leads with full detail
router.get('/closed-leads', auth, hrAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { search, agent } = req.query;
    const filter: Record<string, any> = { status: { $in: ['Closed Won', 'Closed Lost'] } };

    if (agent) {
      filter.$or = [
        { closedBy: agent },
        { assignedAgent: agent },
      ];
    }
    if (search) {
      const s = escapeRegex(String(search));
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

    const leads = await Lead.find(filter).sort({ closedAt: -1, lastActivity: -1 }).limit(500);

    // Bulk query all calls for these leads to avoid N+1
    const leadIds = leads.map((l) => l._id.toString());
    const allCalls = await Call.find({ leadId: { $in: leadIds } }).select('agentName date duration status notes leadId');

    const callsByLead = new Map<string, typeof allCalls>();
    for (const call of allCalls) {
      const key = (call as any).leadId;
      if (!callsByLead.has(key)) callsByLead.set(key, []);
      callsByLead.get(key)!.push(call);
    }

    const leadsWithDetails = leads.map((lead) => {
      const leadId = lead._id.toString();
      const calls = callsByLead.get(leadId) || [];
      const callAgents = Array.from(new Set(calls.map((c) => c.agentName)));
      const leadObj = lead.toJSON();
      return {
        ...leadObj,
        callAgents,
        totalCalls: calls.length,
        callHistory: calls.map((c) => c.toJSON()),
      };
    });

    res.json(leadsWithDetails);
  } catch (err) {
    console.error('HR closed-leads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
