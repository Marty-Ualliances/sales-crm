import { Router, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import PipelineStage from '../models/PipelineStage.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth.js';
import { emitLeadChangedToRoles } from '../socket.js';
import { validate } from '../middleware/validate.js';
import { createLeadSchema, updateLeadSchema } from '../validators/lead.js';

const router = Router();

/** Escape special regex characters to prevent ReDoS */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Multer for CSV upload (5MB limit) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' && file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// ── Helper: get default pipeline stage (order 1) ──
async function getDefaultStage() {
  return PipelineStage.findOne({ isDefault: true, isActive: true }).sort({ order: 1 });
}

// ── Helper: build date-range filter ──
function buildDateFilter(dateFrom?: string, dateTo?: string): Record<string, any> {
  if (!dateFrom && !dateTo) return {};
  const f: Record<string, any> = {};
  if (dateFrom) f.$gte = new Date(dateFrom);
  if (dateTo) f.$lte = new Date(dateTo);
  return { createdAt: f };
}

// ── Helper: populate lead refs ──
const LEAD_POPULATE = [
  { path: 'assignedTo', select: 'name email avatar role' },
  { path: 'uploadedBy', select: 'name email' },
  { path: 'pipelineStage', select: 'name color order probability' },
];

function sanitizeCsvValue(val: string): string {
  const trimmed = val.trim();
  if (/^[=+\-@|\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return trimmed;
}

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/leads — paginated, filtered, role-based
// ════════════════════════════════════════════════════════════════════════════════
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      status, assignedTo, pipelineStage, source, search,
      page = '1', limit = '25', sortBy = 'createdAt', sortOrder = 'desc',
      dateFrom, dateTo,
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};

    // Role-based visibility: SDRs/closers only see their own leads or unassigned leads
    const role = req.user!.role;
    if (role === 'sdr' || role === 'closer') {
      filter.$or = [
        { assignedTo: new mongoose.Types.ObjectId(req.user!.id) },
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ];
    } else if (assignedTo) {
      filter.assignedTo = new mongoose.Types.ObjectId(assignedTo as string);
    }

    if (status) filter.status = status;
    if (pipelineStage) filter.pipelineStage = new mongoose.Types.ObjectId(pipelineStage as string);
    if (source) filter.source = source;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
    }
    if (search) {
      const s = escapeRegex(search as string);
      const searchConditions = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { company: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
      ];
      // Combine with existing role-based $or using $and to avoid clobber
      if (filter.$or) {
        const roleOr = filter.$or;
        delete filter.$or;
        filter.$and = [{ $or: roleOr }, { $or: searchConditions }];
      } else {
        filter.$or = searchConditions;
      }
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;
    const sort: Record<string, 1 | -1> = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate(LEAD_POPULATE)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.json({
      leads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('GET /api/leads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/leads/unassigned — leads without assignedTo
// ════════════════════════════════════════════════════════════════════════════════
router.get('/unassigned', authenticateToken, checkPermission('leads', 'assign'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '25', search } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 25);

    const filter: Record<string, any> = { assignedTo: null };
    if (search) {
      const s = escapeRegex(search);
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate(LEAD_POPULATE)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.json({
      leads,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('GET /api/leads/unassigned error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/leads/kpis — dashboard KPI summary
// ════════════════════════════════════════════════════════════════════════════════
router.get('/kpis', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const baseFilter: Record<string, any> = { isDeleted: { $ne: true } };

    // SDRs/closers only see their own leads
    if (role === 'sdr' || role === 'closer') {
      baseFilter.assignedTo = new mongoose.Types.ObjectId(req.user!.id);
    }

    const [totalLeads, newLeads, closedWon, closedLost, followUpsDue] = await Promise.all([
      Lead.countDocuments(baseFilter),
      Lead.countDocuments({ ...baseFilter, status: 'new' }),
      Lead.countDocuments({ ...baseFilter, status: 'won' }),
      Lead.countDocuments({ ...baseFilter, status: 'lost' }),
      Activity.countDocuments({
        ...(role === 'sdr' || role === 'closer' ? { userId: req.user!.id } : {}),
        type: 'follow_up',
        isCompleted: false,
        scheduledAt: { $lte: new Date() },
      }),
    ]);

    const activeLeads = totalLeads - closedWon - closedLost;

    res.json({ totalLeads, newLeads, activeLeads, closedWon, closedLost, followUpsDue });
  } catch (err) {
    console.error('GET /api/leads/kpis error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/leads/funnel — pipeline funnel analytics
// ════════════════════════════════════════════════════════════════════════════════
router.get('/funnel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const stages = await PipelineStage.find({ isActive: true }).sort({ order: 1 }).lean();

    const baseFilter: Record<string, any> = { isDeleted: { $ne: true } };

    // Stage counts via aggregation
    const stageCounts = await Lead.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
    ]);
    const stageCountMap = new Map(stageCounts.map((s: any) => [s._id?.toString(), s.count]));

    const totalLeads = stageCounts.reduce((acc: number, s: any) => acc + s.count, 0);
    const closedWon = await Lead.countDocuments({ ...baseFilter, status: 'won' });
    const totalRevenue = (await Lead.aggregate([
      { $match: { ...baseFilter, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$dealValue' } } },
    ]))[0]?.total || 0;

    const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

    // Average days in "new" status
    const newLeads = await Lead.find({ ...baseFilter, status: 'new' }).select('createdAt').lean() as unknown as { createdAt: Date }[];
    const now = Date.now();
    const avgDaysNew = newLeads.length > 0
      ? Math.round(newLeads.reduce((acc, l) => acc + (now - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24), 0) / newLeads.length)
      : 0;

    const stageData = stages.map((stage) => ({
      stage: stage.name.toLowerCase().replace(/\s+/g, '_'),
      label: stage.name,
      count: stageCountMap.get(stage._id.toString()) || 0,
      pct: totalLeads > 0 ? Math.round(((stageCountMap.get(stage._id.toString()) || 0) / totalLeads) * 100) : 0,
    }));

    // Per-agent breakdown
    const agentStats = await Lead.aggregate([
      { $match: { ...baseFilter, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          closedWon: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $project: { name: '$user.name', total: 1, closedWon: 1 } },
      { $sort: { closedWon: -1 } },
    ]);

    // Get meeting counts per agent
    const meetingCounts = await Activity.aggregate([
      { $match: { type: 'meeting' } },
      { $group: { _id: '$userId', meetings: { $sum: 1 } } },
    ]);
    const meetingsMap = new Map(meetingCounts.map((m: any) => [m._id.toString(), m.meetings]));

    const byAgent = agentStats.map((a: any) => ({
      name: a.name,
      total: a.total,
      closedWon: a.closedWon,
      meetings: meetingsMap.get(a._id.toString()) || 0,
    }));

    res.json({
      totalLeads,
      closedWon,
      conversionRate,
      totalRevenue,
      avgDaysNew,
      stages: stageData,
      byAgent,
    });
  } catch (err) {
    console.error('GET /api/leads/funnel error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/leads/:id — single lead + last 10 activities
// ════════════════════════════════════════════════════════════════════════════════
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id).populate(LEAD_POPULATE);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // SDRs/closers can only view their own leads or unassigned leads
    const role = req.user!.role;
    if ((role === 'sdr' || role === 'closer')) {
      const isAssignedToMe = lead.assignedTo?.toString() === req.user!.id;
      const isUnassigned = !lead.assignedTo;
      if (!isAssignedToMe && !isUnassigned) {
        return res.status(403).json({ error: 'Not authorized to view this lead' });
      }
    }

    const activities = await Activity.find({ leadId: lead._id })
      .populate('userId', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ lead, activities });
  } catch (err) {
    console.error('GET /api/leads/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads — create a lead
// ════════════════════════════════════════════════════════════════════════════════
router.post('/', authenticateToken, validate(createLeadSchema), async (req: AuthRequest, res: Response) => {
  try {
    const defaultStage = await getDefaultStage();

    const leadData = {
      ...req.body,
      uploadedBy: req.user!.id,
      pipelineStage: req.body.pipelineStage || defaultStage?._id || null,
      status: req.body.status || 'new',
      source: req.body.source || 'manual',
    };

    const lead = new Lead(leadData);
    await lead.save();

    // Log activity
    await Activity.create({
      leadId: lead._id,
      userId: req.user!.id,
      type: 'upload',
      description: `Lead created by ${req.user!.name}`,
    });

    const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE);

    emitLeadChangedToRoles('created', { leadId: lead._id.toString() });
    res.status(201).json(populated);
  } catch (err: any) {
    console.error('POST /api/leads error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A lead with this email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// PATCH /api/leads/:id — update a lead (with optimistic concurrency)
// ════════════════════════════════════════════════════════════════════════════════
router.patch('/:id', authenticateToken, checkPermission('leads', 'edit'), validate(updateLeadSchema), async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const role = req.user!.role;
    if ((role === 'sdr' || role === 'closer') && lead.assignedTo?.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to edit this lead' });
    }

    const oldStatus = lead.status;
    const updates = req.body; // already sanitized and whitelisted by Zod strip()

    // Apply updates
    Object.keys(updates).forEach((key) => {
      (lead as any)[key] = updates[key];
    });

    await lead.save(); // optimistic concurrency checks __v

    // Log status change activity
    if (updates.status && updates.status !== oldStatus) {
      await Activity.create({
        leadId: lead._id,
        userId: req.user!.id,
        type: 'status_change',
        fromStatus: oldStatus,
        toStatus: updates.status,
        description: `Status changed from "${oldStatus}" to "${updates.status}"`,
      });
    }

    const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE);

    emitLeadChangedToRoles('updated', {
      leadId: lead._id.toString(),
      assignedUserId: lead.assignedTo?.toString(),
    });

    res.json(populated);
  } catch (err: any) {
    if (err.name === 'VersionError') {
      return res.status(409).json({
        error: 'This lead was modified by another user. Please refresh and try again.',
      });
    }
    console.error('PATCH /api/leads/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// DELETE /api/leads/:id — soft delete (admin only)
// ════════════════════════════════════════════════════════════════════════════════
router.delete('/:id', authenticateToken, checkPermission('leads', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    // Query with isDeleted override to find the lead even if already soft-deleted check later
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    lead.isDeleted = true;
    lead.deletedAt = new Date();
    lead.deletedBy = new mongoose.Types.ObjectId(req.user!.id);
    await lead.save();

    emitLeadChangedToRoles('deleted', { leadId: lead._id.toString() });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    console.error('DELETE /api/leads/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/bulk-upload — CSV upload
// ════════════════════════════════════════════════════════════════════════════════
router.post('/bulk-upload', authenticateToken, checkPermission('leads', 'upload'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have a header row and at least one data row' });
    }

    if (lines.length > 1001) {
      return res.status(400).json({ error: 'CSV must contain at most 1000 data rows' });
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

    // Column mapping (case-insensitive, flexible)
    const colMap: Record<string, string> = {};
    const FIELD_ALIASES: Record<string, string[]> = {
      firstName: ['first_name', 'firstname', 'first name', 'fname'],
      lastName: ['last_name', 'lastname', 'last name', 'lname'],
      email: ['email', 'email_address', 'emailaddress', 'e-mail'],
      phone: ['phone', 'phone_number', 'phonenumber', 'telephone', 'tel'],
      company: ['company', 'company_name', 'companyname', 'organization', 'org'],
      jobTitle: ['job_title', 'jobtitle', 'title', 'position', 'role'],
      source: ['source', 'lead_source', 'leadsource'],
      website: ['website', 'url', 'web'],
      address: ['address', 'street', 'street_address'],
      city: ['city'],
      state: ['state', 'province', 'region'],
      notes: ['notes', 'note', 'comments', 'description'],
    };

    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      const idx = headers.findIndex((h) => aliases.includes(h));
      if (idx !== -1) {
        colMap[field] = headers[idx];
      }
    }

    // If there's a single "name" column, use it for firstName
    if (!colMap.firstName) {
      const nameIdx = headers.findIndex((h) => h === 'name' || h === 'full_name' || h === 'fullname');
      if (nameIdx !== -1) colMap.firstName = headers[nameIdx];
    }

    const defaultStage = await getDefaultStage();
    const errors: { row: number; error: string }[] = [];
    const emailsSeen = new Set<string>();
    let duplicatesInFile = 0;
    let duplicatesInDB = 0;
    const leadsToInsert: any[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        // Simple CSV parsing (handles quoted fields with commas)
        const values: string[] = [];
        let current = '';
        let inQuote = false;
        for (const char of lines[i]) {
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const getVal = (field: string) => {
          const header = colMap[field];
          if (!header) return '';
          const idx = headers.indexOf(header);
          return idx >= 0 ? sanitizeCsvValue(values[idx] || '') : '';
        };

        const firstName = getVal('firstName');
        const lastName = getVal('lastName');
        const email = getVal('email').toLowerCase();

        // Validate: need at least email or name
        if (!email && !firstName && !lastName) {
          errors.push({ row: i + 1, error: 'Missing both email and name' });
          continue;
        }

        // Deduplicate within file
        if (email) {
          if (emailsSeen.has(email)) {
            duplicatesInFile++;
            continue;
          }
          emailsSeen.add(email);
        }

        leadsToInsert.push({
          firstName: firstName || '',
          lastName: lastName || '',
          email,
          phone: getVal('phone'),
          company: getVal('company'),
          jobTitle: getVal('jobTitle'),
          website: getVal('website'),
          address: getVal('address'),
          city: getVal('city'),
          state: getVal('state'),
          notes: getVal('notes'),
          source: 'csv_upload' as const,
          uploadedBy: new mongoose.Types.ObjectId(req.user!.id),
          pipelineStage: defaultStage?._id || null,
          status: 'new' as const,
        });
      } catch {
        errors.push({ row: i + 1, error: 'Failed to parse row' });
      }
    }

    // Deduplicate against DB by email
    const emailsToCheck = leadsToInsert.filter((l) => l.email).map((l) => l.email);
    if (emailsToCheck.length > 0) {
      const existing = await Lead.find({ email: { $in: emailsToCheck } }).select('email').lean();
      const existingEmails = new Set(existing.map((e: any) => e.email));
      const filtered = leadsToInsert.filter((l) => {
        if (l.email && existingEmails.has(l.email)) {
          duplicatesInDB++;
          return false;
        }
        return true;
      });
      leadsToInsert.length = 0;
      leadsToInsert.push(...filtered);
    }

    // Bulk insert
    let createdLeads: any[] = [];
    if (leadsToInsert.length > 0) {
      createdLeads = await Lead.insertMany(leadsToInsert, { ordered: false });

      // Log upload activities
      const activityDocs = createdLeads.map((lead: any) => ({
        leadId: lead._id,
        userId: new mongoose.Types.ObjectId(req.user!.id),
        type: 'upload' as const,
        description: `Lead uploaded via CSV by ${req.user!.name}`,
      }));
      await Activity.insertMany(activityDocs, { ordered: false });
    }

    emitLeadChangedToRoles('bulk_created', { count: createdLeads.length });

    res.json({
      totalRows: lines.length - 1,
      created: createdLeads.length,
      duplicatesInFile,
      duplicatesInDB,
      errors,
    });
  } catch (err) {
    console.error('POST /api/leads/bulk-upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/:id/assign — assign lead to user
// ════════════════════════════════════════════════════════════════════════════════
router.post('/:id/assign', authenticateToken, checkPermission('leads', 'assign'), async (req: AuthRequest, res: Response) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ error: 'assignedTo is required' });

    // Validate target user is SDR or closer
    const targetUser = await User.findById(assignedTo);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
    if (!['sdr', 'closer'].includes(targetUser.role)) {
      return res.status(400).json({ error: 'Leads can only be assigned to SDRs or Closers' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const previousAssignee = lead.assignedTo?.toString() || null;
    lead.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    lead.assignedAt = new Date();
    await lead.save();

    // Log activity
    await Activity.create({
      leadId: lead._id,
      userId: req.user!.id,
      type: 'assignment',
      description: `Lead assigned to ${targetUser.name} by ${req.user!.name}`,
      metadata: { previousAssignee, newAssignee: assignedTo },
    });

    const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE);

    emitLeadChangedToRoles('assigned', {
      leadId: lead._id.toString(),
      assignedUserId: assignedTo,
    });

    res.json(populated);
  } catch (err) {
    console.error('POST /api/leads/:id/assign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/bulk-assign — assign multiple leads
// ════════════════════════════════════════════════════════════════════════════════
router.post('/bulk-assign', authenticateToken, checkPermission('leads', 'assign'), async (req: AuthRequest, res: Response) => {
  try {
    const { leadIds, assignedTo, teamId, method } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds array is required' });
    }

    let assignees: string[] = [];

    if (method === 'round_robin' && teamId) {
      // Get active SDR members of the team
      const team = await Team.findById(teamId).populate('members', 'role isActive');
      if (!team) return res.status(404).json({ error: 'Team not found' });

      assignees = (team.members as any[])
        .filter((m: any) => m.isActive && ['sdr', 'closer'].includes(m.role))
        .map((m: any) => m._id.toString());

      if (assignees.length === 0) {
        return res.status(400).json({ error: 'No active SDRs/closers in this team' });
      }
    } else if (assignedTo) {
      const targetUser = await User.findById(assignedTo);
      if (!targetUser || !['sdr', 'closer'].includes(targetUser.role)) {
        return res.status(400).json({ error: 'Target user must be an SDR or Closer' });
      }
      assignees = [assignedTo];
    } else {
      return res.status(400).json({ error: 'Provide assignedTo or teamId+method' });
    }

    const results: any[] = [];
    const activities: any[] = [];

    for (let i = 0; i < leadIds.length; i++) {
      const lead = await Lead.findById(leadIds[i]);
      if (!lead) continue;

      const targetId = assignees[i % assignees.length];
      lead.assignedTo = new mongoose.Types.ObjectId(targetId);
      lead.assignedAt = new Date();
      await lead.save();

      activities.push({
        leadId: lead._id,
        userId: new mongoose.Types.ObjectId(req.user!.id),
        type: 'assignment' as const,
        description: `Lead assigned via bulk assignment by ${req.user!.name}`,
        metadata: { newAssignee: targetId },
      });

      results.push({ leadId: lead._id.toString(), assignedTo: targetId });
    }

    if (activities.length > 0) {
      await Activity.insertMany(activities, { ordered: false });
    }

    emitLeadChangedToRoles('bulk_assigned', { count: results.length });
    res.json({ assigned: results.length, results });
  } catch (err) {
    console.error('POST /api/leads/bulk-assign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/:id/unassign — remove assignment
// ════════════════════════════════════════════════════════════════════════════════
router.post('/:id/unassign', authenticateToken, checkPermission('leads', 'assign'), async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const previousAssignee = lead.assignedTo?.toString() || null;
    lead.assignedTo = null;
    lead.assignedAt = null;
    await lead.save();

    await Activity.create({
      leadId: lead._id,
      userId: req.user!.id,
      type: 'assignment',
      description: `Lead unassigned by ${req.user!.name}`,
      metadata: { previousAssignee, newAssignee: null },
    });

    const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE);
    emitLeadChangedToRoles('unassigned', { leadId: lead._id.toString() });
    res.json(populated);
  } catch (err) {
    console.error('POST /api/leads/:id/unassign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/:id/complete-followup — mark follow-up as complete
// ════════════════════════════════════════════════════════════════════════════════
router.post('/:id/complete-followup', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const role = req.user!.role;
    if (role !== 'admin' && role !== 'manager' && lead.assignedTo?.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to complete this follow-up' });
    }

    // Mark latest incomplete follow_up activity for this lead as complete
    const followUp = await Activity.findOne({
      leadId: lead._id,
      type: 'follow_up',
      isCompleted: false,
    }).sort({ scheduledAt: 1 });

    if (followUp) {
      followUp.isCompleted = true;
      followUp.completedAt = new Date();
      await followUp.save();
    }

    await Activity.create({
      leadId: lead._id,
      userId: req.user!.id,
      type: 'follow_up',
      description: `Follow-up completed by ${req.user!.name}`,
      isCompleted: true,
      completedAt: new Date(),
    });

    emitLeadChangedToRoles('updated', { leadId: lead._id.toString() });
    res.json({ message: 'Follow-up completed' });
  } catch (err) {
    console.error('POST /api/leads/:id/complete-followup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/:id/schedule-followup — schedule a follow-up
// ════════════════════════════════════════════════════════════════════════════════
router.post('/:id/schedule-followup', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Ownership check: only admin/manager or the assigned agent can schedule follow-ups
    const schedRole = req.user!.role;
    if (schedRole !== 'admin' && schedRole !== 'manager' && lead.assignedTo?.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to schedule follow-ups for this lead' });
    }

    const activity = await Activity.create({
      leadId: lead._id,
      userId: req.user!.id,
      type: 'follow_up',
      description: `Follow-up scheduled for ${new Date(date).toLocaleDateString()}`,
      scheduledAt: new Date(date),
      isCompleted: false,
    });

    emitLeadChangedToRoles('updated', { leadId: lead._id.toString() });
    res.status(201).json(activity);
  } catch (err) {
    console.error('POST /api/leads/:id/schedule-followup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/bulk-delete — soft delete multiple leads (admin only)
// ════════════════════════════════════════════════════════════════════════════════
router.post('/bulk-delete', authenticateToken, checkPermission('leads', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds array is required' });
    }

    const result = await Lead.updateMany(
      { _id: { $in: leadIds.map((id: string) => new mongoose.Types.ObjectId(id)) } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new mongoose.Types.ObjectId(req.user!.id),
        },
      }
    );

    emitLeadChangedToRoles('bulk_deleted', { count: result.modifiedCount });
    res.json({ deleted: result.modifiedCount });
  } catch (err) {
    console.error('POST /api/leads/bulk-delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/import/preview — CSV import preview with column mapping
// ════════════════════════════════════════════════════════════════════════════════
router.post('/import/preview', authenticateToken, checkPermission('leads', 'upload'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have a header and at least one data row' });
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    // Parse first 5 rows for preview
    const preview: Record<string, string>[] = [];
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values: string[] = [];
      let current = '';
      let inQuote = false;
      for (const char of lines[i]) {
        if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { values.push(current.trim()); current = ''; }
        else { current += char; }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      preview.push(row);
    }

    // Auto-map columns using csvColumnMapper if available
    let mappings: Record<string, string | null> = {};
    try {
      const { mapColumns } = await import('../utils/csvColumnMapper.js');
      const result = mapColumns(headers);
      mappings = result.headerMap;
    } catch {
      // Fallback: basic lowercase matching
      const basicFields = ['firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle', 'source', 'website', 'address', 'city', 'state', 'notes'];
      for (const h of headers) {
        const lower = h.toLowerCase().replace(/[_\s]+/g, '');
        const match = basicFields.find(f => f.toLowerCase() === lower);
        mappings[h] = match || null;
      }
    }

    res.json({
      headers,
      totalRows: lines.length - 1,
      preview,
      mappings,
    });
  } catch (err) {
    console.error('POST /api/leads/import/preview error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/leads/import — CSV import with custom mappings
// ════════════════════════════════════════════════════════════════════════════════
router.post('/import', authenticateToken, checkPermission('leads', 'upload'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const customMappings: Record<string, string | null> = req.body.customMappings
      ? JSON.parse(req.body.customMappings)
      : null;

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return res.status(400).json({ error: 'CSV must have a header and at least one data row' });

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    // Determine field mapping
    let fieldMap: Record<string, string | null> = {};
    if (customMappings) {
      fieldMap = customMappings;
    } else {
      try {
        const { mapColumns } = await import('../utils/csvColumnMapper.js');
        fieldMap = mapColumns(headers).headerMap;
      } catch {
        // Basic fallback
        const basicFields = ['firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle'];
        for (const h of headers) {
          const lower = h.toLowerCase().replace(/[_\s]+/g, '');
          fieldMap[h] = basicFields.find(f => f.toLowerCase() === lower) || null;
        }
      }
    }

    const defaultStage = await getDefaultStage();
    const errors: { row: number; error: string }[] = [];
    const emailsSeen = new Set<string>();
    let duplicatesInFile = 0;
    let duplicatesInDB = 0;
    const leadsToInsert: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values: string[] = [];
        let current = '';
        let inQuote = false;
        for (const char of lines[i]) {
          if (char === '"') { inQuote = !inQuote; }
          else if (char === ',' && !inQuote) { values.push(current.trim()); current = ''; }
          else { current += char; }
        }
        values.push(current.trim());

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          const field = fieldMap[h];
          if (field) row[field] = sanitizeCsvValue(values[idx] || '');
        });

        const email = (row.email || '').toLowerCase();

        // Need email or name
        if (!email && !row.firstName && !row.lastName && !row.name) {
          errors.push({ row: i + 1, error: 'Missing both email and name' });
          continue;
        }

        if (email) {
          if (emailsSeen.has(email)) { duplicatesInFile++; continue; }
          emailsSeen.add(email);
        }

        // Handle single 'name' field split into firstName/lastName
        let firstName = row.firstName || '';
        let lastName = row.lastName || '';
        if (!firstName && !lastName && row.name) {
          const parts = row.name.split(/\s+/);
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        leadsToInsert.push({
          firstName,
          lastName,
          email,
          phone: row.phone || '',
          company: row.company || row.companyName || '',
          jobTitle: row.jobTitle || row.title || '',
          website: row.website || '',
          address: row.address || '',
          city: row.city || '',
          state: row.state || '',
          notes: row.notes || '',
          source: 'csv_upload' as const,
          uploadedBy: new mongoose.Types.ObjectId(req.user!.id),
          pipelineStage: defaultStage?._id || null,
          status: 'new' as const,
        });
      } catch {
        errors.push({ row: i + 1, error: 'Failed to parse row' });
      }
    }

    // Deduplicate against DB
    const emailsToCheck = leadsToInsert.filter(l => l.email).map(l => l.email);
    if (emailsToCheck.length > 0) {
      const existing = await Lead.find({ email: { $in: emailsToCheck } }).select('email').lean();
      const existingEmails = new Set(existing.map((e: any) => e.email));
      const filtered = leadsToInsert.filter(l => {
        if (l.email && existingEmails.has(l.email)) { duplicatesInDB++; return false; }
        return true;
      });
      leadsToInsert.length = 0;
      leadsToInsert.push(...filtered);
    }

    let createdLeads: any[] = [];
    if (leadsToInsert.length > 0) {
      createdLeads = await Lead.insertMany(leadsToInsert, { ordered: false });
      const activityDocs = createdLeads.map((lead: any) => ({
        leadId: lead._id,
        userId: new mongoose.Types.ObjectId(req.user!.id),
        type: 'upload' as const,
        description: `Lead imported via CSV by ${req.user!.name}`,
      }));
      await Activity.insertMany(activityDocs, { ordered: false });
    }

    emitLeadChangedToRoles('bulk_created', { count: createdLeads.length });

    res.json({
      totalRows: lines.length - 1,
      created: createdLeads.length,
      duplicatesInFile,
      duplicatesInDB,
      errors,
    });
  } catch (err) {
    console.error('POST /api/leads/import error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
