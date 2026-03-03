import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/hr/dashboard — HR dashboard stats
router.get('/dashboard', authenticateToken, checkPermission('analytics', 'view_all'), async (req: AuthRequest, res: Response) => {
  try {
    const { timeRange } = req.query;

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

    const leadFilter = { isDeleted: false, ...dateFilter };

    const totalLeads = await Lead.countDocuments(leadFilter);
    const closedLeads = await Lead.countDocuments({ ...leadFilter, status: 'won' });
    const lostLeads = await Lead.countDocuments({ ...leadFilter, status: 'lost' });
    const activeLeads = totalLeads - closedLeads - lostLeads;
    const totalCalls = await Activity.countDocuments({ type: 'call', ...dateFilter });

    // SDRs and Closers performance
    const agents = await User.find({ role: { $in: ['sdr', 'closer'] } }).select('name role');
    const agentIds = agents.map(a => a._id);

    const [leadsAddedAgg, callsMadeAgg, leadsAssignedAgg, leadsClosedAgg] = await Promise.all([
      Lead.aggregate([
        { $match: { uploadedBy: { $in: agentIds }, isDeleted: false, ...dateFilter } },
        { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
      ]),
      Activity.aggregate([
        { $match: { userId: { $in: agentIds }, type: 'call', ...dateFilter } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: { assignedTo: { $in: agentIds }, isDeleted: false, ...dateFilter } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: { assignedTo: { $in: agentIds }, isDeleted: false, status: 'won', ...dateFilter } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      ]),
    ]);

    const addedMap = new Map(leadsAddedAgg.map((r: any) => [r._id.toString(), r.count]));
    const callsMap = new Map(callsMadeAgg.map((r: any) => [r._id.toString(), r.count]));
    const assignedMap = new Map(leadsAssignedAgg.map((r: any) => [r._id.toString(), r.count]));
    const closedMap = new Map(leadsClosedAgg.map((r: any) => [r._id.toString(), r.count]));

    const agentPerformance = agents.map((agent) => {
      const idStr = agent._id.toString();
      return {
        id: idStr,
        name: agent.name,
        role: agent.role,
        leadsAdded: addedMap.get(idStr) || 0,
        leadsAssigned: assignedMap.get(idStr) || 0,
        callsMade: callsMap.get(idStr) || 0,
        leadsClosed: closedMap.get(idStr) || 0,
      };
    });

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

// GET /api/hr/leads — all leads with call tracking
router.get('/leads', authenticateToken, checkPermission('analytics', 'view_all'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, agent } = req.query;
    const filter: Record<string, any> = { isDeleted: false };

    if (status && status !== 'all') filter.status = status;
    if (agent) {
      filter.$or = [
        { uploadedBy: new mongoose.Types.ObjectId(agent as string) },
        { assignedTo: new mongoose.Types.ObjectId(agent as string) },
      ];
    }
    if (search) {
      const s = escapeRegex(String(search));
      const searchConditions = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { company: { $regex: s, $options: 'i' } },
      ];
      // Combine with existing agent $or using $and to avoid clobber
      if (filter.$or) {
        const agentOr = filter.$or;
        delete filter.$or;
        filter.$and = [{ $or: agentOr }, { $or: searchConditions }];
      } else {
        filter.$or = searchConditions;
      }
    }

    const pageNum = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '200'), 10) || 200));
    const skip = (pageNum - 1) * limitNum;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email role')
        .populate('uploadedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    const leadIds = leads.map((l) => l._id);
    const calls = await Activity.find({
      leadId: { $in: leadIds },
      type: 'call'
    }).populate('userId', 'name').lean();

    const callsByLead = new Map<string, typeof calls>();
    for (const call of calls) {
      const key = call.leadId.toString();
      if (!callsByLead.has(key)) callsByLead.set(key, []);
      callsByLead.get(key)!.push(call);
    }

    const leadsWithCallAgents = leads.map((lead) => {
      const leadId = lead._id.toString();
      const leadCalls = callsByLead.get(leadId) || [];
      const callAgents = Array.from(new Set(leadCalls.map((c) => (c.userId as any)?.name || 'Unknown')));
      return {
        ...lead,
        callAgents,
        callCount: leadCalls.length,
        callHistory: leadCalls,
      };
    });

    res.json({ leads: leadsWithCallAgents, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('HR leads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hr/closed-leads
router.get('/closed-leads', authenticateToken, checkPermission('analytics', 'view_all'), async (req: AuthRequest, res: Response) => {
  try {
    const { search, agent } = req.query;
    const filter: Record<string, any> = {
      isDeleted: false,
      status: { $in: ['won', 'lost'] }
    };

    if (agent) {
      filter.assignedTo = new mongoose.Types.ObjectId(agent as string);
    }

    if (search) {
      const s = escapeRegex(String(search));
      filter.$and = [
        {
          $or: [
            { firstName: { $regex: s, $options: 'i' } },
            { lastName: { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
            { company: { $regex: s, $options: 'i' } },
          ],
        },
      ];
    }

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();

    const leadIds = leads.map((l) => l._id);
    const calls = await Activity.find({
      leadId: { $in: leadIds },
      type: 'call'
    }).populate('userId', 'name').lean();

    const callsByLead = new Map<string, typeof calls>();
    for (const call of calls) {
      const key = call.leadId.toString();
      if (!callsByLead.has(key)) callsByLead.set(key, []);
      callsByLead.get(key)!.push(call);
    }

    const leadsWithDetails = leads.map((lead) => {
      const leadId = lead._id.toString();
      const leadCalls = callsByLead.get(leadId) || [];
      const callAgents = Array.from(new Set(leadCalls.map((c) => (c.userId as any)?.name || 'Unknown')));
      return {
        ...lead,
        callAgents,
        totalCalls: leadCalls.length,
        callHistory: leadCalls,
      };
    });

    res.json(leadsWithDetails);
  } catch (err) {
    console.error('HR closed-leads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
