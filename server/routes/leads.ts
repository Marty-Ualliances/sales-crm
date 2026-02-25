import { Router, Response } from 'express';
import multer from 'multer';
import Lead from '../models/Lead';
import { auth, adminOnly, leadgenOrAdmin, AuthRequest } from '../middleware/auth';
import { notifyLeadStatusChange, notifyNewLead, notifyFollowUpDue, notifyLeadImported } from '../utils/notificationHelper';
import { getIO } from '../socket';

function emitLeadChange(action: string, data?: any) {
  try { getIO().emit('lead:changed', { action, ...(data || {}) }); } catch (_) { }
}

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});

// ── CSV column name → model field mapping ──
const CSV_FIELD_MAP: Record<string, string> = {
  'date': 'date',
  'source': 'source',
  'name': 'name',
  'title': 'title',
  'company name': 'companyName',
  'company': 'companyName',
  'email': 'email',
  'work direct phone': 'workDirectPhone',
  'work phone': 'workDirectPhone',
  'home phone': 'homePhone',
  'home phone number': 'homePhone',
  'mobile phone': 'mobilePhone',
  'mobile': 'mobilePhone',
  'corporate phone': 'corporatePhone',
  'other phone': 'otherPhone',
  'company phone': 'companyPhone',
  'employees': 'employees',
  'person linkedin url': 'personLinkedinUrl',
  'linkedin': 'personLinkedinUrl',
  'website': 'website',
  'company linkedin url': 'companyLinkedinUrl',
  'city': 'city',
  'state': 'state',
  'assigned': 'assignedAgent',
  'assigned agent': 'assignedAgent',
  'status': 'status',
  'notes': 'notes',
  'phone': 'workDirectPhone',
  'follow-up date': 'nextFollowUp',
  'follow up date': 'nextFollowUp',
};

// Auto-detect whether the file uses tabs or commas as delimiter
function detectDelimiter(headerLine: string): string {
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// GET /api/leads — get all leads (admin) or agent's leads (sdr)
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, agent } = req.query;
    const filter: any = {};

    if (req.user!.role === 'sdr') {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user!.id);
      if (user) filter.assignedAgent = user.name;
    } else if (agent) {
      filter.assignedAgent = agent;
    }
    // admin, leadgen, hr see all leads (no extra filter)

    if (status && status !== 'all') filter.status = status;
    if (search) {
      const s = String(search);
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { companyName: { $regex: s, $options: 'i' } },
        { workDirectPhone: { $regex: s, $options: 'i' } },
        { mobilePhone: { $regex: s, $options: 'i' } },
        { city: { $regex: s, $options: 'i' } },
        { state: { $regex: s, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(filter).sort({ lastActivity: -1 });
    res.json(leads);
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leads/kpis
router.get('/kpis', auth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.user!.role === 'sdr') {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user!.id);
      if (user) filter.assignedAgent = user.name;
    }

    const leads = await Lead.find(filter);
    const today = new Date();
    const totalLeads = leads.length;
    const totalCalls = leads.reduce((sum, l) => sum + l.callCount, 0);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);
    const recentActivity = leads.filter(l => l.lastActivity >= sevenDaysAgo).length;
    const followUpsRemaining = leads.filter(l => l.nextFollowUp && l.status !== 'Closed Won' && l.status !== 'Closed Lost').length;
    const overdueFollowUps = leads.filter(l => l.nextFollowUp && l.nextFollowUp < today && l.status !== 'Closed Won' && l.status !== 'Closed Lost').length;
    const closedCount = leads.filter(l => l.status === 'Closed Won').length;
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0;
    const totalRevenue = leads.reduce((sum, l) => sum + (l.revenue || 0), 0);
    const appointmentsBooked = leads.filter(l => l.status === 'Meeting Booked' || l.status === 'Meeting Completed').length;

    res.json({
      totalLeads,
      totalCalls,
      recentActivity,
      followUpsRemaining,
      overdueFollowUps,
      appointmentsBooked,
      conversionRate,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leads/funnel — admin funnel KPI metrics
router.get('/funnel', auth, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const leads = await Lead.find({}).lean();
    const { PIPELINE_STAGES } = await import('../constants/pipeline');

    const total = leads.length || 1; // avoid div/0
    const stages = PIPELINE_STAGES.map(s => {
      const count = leads.filter((l: any) => l.status === s.key).length;
      return { stage: s.key, label: s.label, count, pct: Math.round((count / total) * 100) };
    });

    const closedWon = leads.filter((l: any) => l.status === 'Closed Won').length;
    const conversionRate = Math.round((closedWon / total) * 100);
    const totalRevenue = leads.reduce((sum: number, l: any) => sum + (l.revenue || 0), 0);

    // Per-agent breakdown
    const agentMap: Record<string, { total: number; closedWon: number; meetings: number }> = {};
    for (const lead of leads as any[]) {
      const a = lead.assignedAgent || 'Unassigned';
      if (!agentMap[a]) agentMap[a] = { total: 0, closedWon: 0, meetings: 0 };
      agentMap[a].total++;
      if (lead.status === 'Closed Won') agentMap[a].closedWon++;
      if (lead.status === 'Meeting Booked' || lead.status === 'Meeting Completed') agentMap[a].meetings++;
    }
    const byAgent = Object.entries(agentMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);

    // Avg days in stage (for stuck leads)
    const now = Date.now();
    const avgDaysNew = (() => {
      const newLeads = leads.filter((l: any) => l.status === 'New Lead') as any[];
      if (!newLeads.length) return 0;
      const sum = newLeads.reduce((s: number, l: any) => {
        const created = l.createdAt ? new Date(l.createdAt).getTime() : now;
        return s + (now - created) / 86400000;
      }, 0);
      return Math.round(sum / newLeads.length);
    })();

    res.json({ stages, conversionRate, totalRevenue, closedWon, byAgent, avgDaysNew, totalLeads: leads.length });
  } catch (err) {
    console.error('Funnel KPI error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leads/:id
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const User = (await import('../models/User')).default;
    const currentUser = await User.findById(req.user!.id);
    const lead = new Lead({ ...req.body, addedBy: currentUser?.name || 'Unknown' });
    await lead.save();

    // Create notification for new lead
    await notifyNewLead(lead._id.toString(), lead.name, lead.assignedAgent);
    emitLeadChange('created', { leadId: lead._id });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Allowed enum values for validation
const VALID_SOURCES = ['CSV Import', 'Manual', 'Website', 'Referral', 'LinkedIn', 'Cold – High Fit', 'Warm – Engaged', 'Cold – Quick Sourced', 'Cold – Bulk Data', 'Other'];
const VALID_STATUSES = ['New Lead', 'Working', 'Connected', 'Qualified', 'Meeting Booked', 'Meeting Completed', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost', 'Nurture'];

// POST /api/leads/import — CSV bulk import (flexible)
router.post('/import', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = req.file.buffer.toString('utf-8');
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: 'CSV must have a header row and at least one data row' });

    // Auto-detect tab vs comma delimiter
    const delimiter = detectDelimiter(lines[0]);
    console.log(`[CSV Import] Detected delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}, ${lines.length - 1} data rows`);

    const rawHeaders = parseCSVLine(lines[0], delimiter).map(h => h.replace(/^"|"$/g, '').trim());
    const headerMap = rawHeaders.map(h => {
      const key = h.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      return CSV_FIELD_MAP[key] || null;
    });

    // Track which headers are unknown (not mapped) — we'll store their data in notes
    const unmappedHeaders = rawHeaders.map((h, idx) => headerMap[idx] === null ? h : null);

    // Get current user for default agent assignment
    const User = (await import('../models/User')).default;
    const currentUser = await User.findById(req.user!.id);
    const defaultAgent = currentUser?.name || 'Unassigned';

    const imported: any[] = [];
    const errors: { row: number; error: string }[] = [];
    const skipped: number[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const vals = parseCSVLine(lines[i], delimiter);

        // Skip completely empty rows
        const hasData = vals.some(v => v.replace(/^"|"$/g, '').trim().length > 0);
        if (!hasData) { skipped.push(i + 1); continue; }

        const doc: any = {
          source: 'CSV Import',
          date: new Date(),
          assignedAgent: defaultAgent,
          status: 'New Lead',
        };

        // Map known columns
        headerMap.forEach((field, idx) => {
          if (!field || !vals[idx]) return;
          const v = vals[idx].replace(/^"|"$/g, '').trim();
          if (!v) return;
          if (field === 'employees') {
            doc[field] = parseInt(v, 10) || null;
          } else if (field === 'nextFollowUp' || field === 'date') {
            const d = new Date(v);
            if (!isNaN(d.getTime())) doc[field] = d;
          } else {
            doc[field] = v;
          }
        });

        // Collect data from unknown/unmapped columns and append to notes
        const extraFields: string[] = [];
        unmappedHeaders.forEach((header, idx) => {
          if (!header || !vals[idx]) return;
          const v = vals[idx].replace(/^"|"$/g, '').trim();
          if (v) extraFields.push(`${header}: ${v}`);
        });
        if (extraFields.length > 0) {
          const existingNotes = doc.notes || '';
          doc.notes = existingNotes
            ? `${existingNotes}\n--- Extra CSV Fields ---\n${extraFields.join('\n')}`
            : `--- Extra CSV Fields ---\n${extraFields.join('\n')}`;
        }

        // If name is missing, use first available identifier or 'Unknown'
        if (!doc.name) {
          doc.name = doc.email || doc.companyName || `Unknown Lead (Row ${i + 1})`;
        }

        // If source from CSV is not a valid enum, keep default 'CSV Import'
        if (doc.source && !VALID_SOURCES.includes(doc.source)) {
          const originalSource = doc.source;
          doc.source = 'CSV Import';
          doc.notes = (doc.notes || '') + `\nOriginal source: ${originalSource}`;
        }

        // If status from CSV is not a valid enum, keep default 'New Lead'
        if (doc.status && !VALID_STATUSES.includes(doc.status)) {
          const originalStatus = doc.status;
          doc.status = 'New Lead';
          doc.notes = (doc.notes || '') + `\nOriginal status: ${originalStatus}`;
        }

        doc.addedBy = defaultAgent;
        doc.activities = [{ type: 'note', description: 'Lead imported via CSV', timestamp: new Date(), agent: defaultAgent }];
        doc.stageHistory = [{ stage: doc.status, enteredAt: new Date(), agent: defaultAgent }];

        const lead = new Lead(doc);
        await lead.save();
        imported.push(lead);
      } catch (e: any) {
        errors.push({ row: i + 1, error: e.message });
      }
    }

    // Create notification for successful import
    if (imported.length > 0) {
      await notifyLeadImported(imported.length);
      emitLeadChange('imported', { count: imported.length });
    }

    res.json({
      imported: imported.length,
      errors: errors.length,
      skipped: skipped.length,
      errorDetails: errors.slice(0, 20),
      total: lines.length - 1,
    });
  } catch (err: any) {
    console.error('CSV import error:', err);
    res.status(500).json({ error: 'Import failed' });
  }
});

// PUT /api/leads/:id
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const oldLead = await Lead.findById(req.params.id);

    // Track who closed the lead
    if (req.body.status === 'Closed Won' && oldLead && oldLead.status !== 'Closed Won') {
      const User = (await import('../models/User')).default;
      const currentUser = await User.findById(req.user!.id);
      req.body.closedBy = currentUser?.name || 'Unknown';
      req.body.closedAt = new Date();
    }

    // Push stageHistory entry on status change
    if (oldLead && req.body.status && oldLead.status !== req.body.status) {
      const User2 = (await import('../models/User')).default;
      const currentUser2 = await User2.findById(req.user!.id);
      if (!req.body.$push) req.body.$push = {};
      req.body.$push.stageHistory = {
        stage: req.body.status,
        enteredAt: new Date(),
        agent: currentUser2?.name || 'Unknown',
      };
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Create notification for status change
    if (oldLead && req.body.status && oldLead.status !== req.body.status) {
      await notifyLeadStatusChange(lead._id.toString(), lead.name, oldLead.status, req.body.status);
    }
    emitLeadChange('updated', { leadId: lead._id });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/:id/complete-followup — mark follow-up as complete
router.post('/:id/complete-followup', auth, async (req: AuthRequest, res: Response) => {
  try {
    const User = (await import('../models/User')).default;
    const currentUser = await User.findById(req.user!.id);
    const agentName = currentUser?.name || 'Unknown';

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    lead.activities.push({
      type: 'follow-up',
      description: 'Follow-up completed',
      timestamp: new Date(),
      agent: agentName,
    });
    lead.nextFollowUp = null;
    lead.lastActivity = new Date();
    if (lead.status === 'New Lead') lead.status = 'Working' as any;

    // Optionally update user stats
    if (currentUser) {
      currentUser.followUpsCompleted = (currentUser.followUpsCompleted || 0) + 1;
      currentUser.followUpsPending = Math.max(0, (currentUser.followUpsPending || 0) - 1);
      await currentUser.save();
    }

    await lead.save();
    res.json(lead);
  } catch (err) {
    console.error('Complete follow-up error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/:id/schedule-followup — schedule a new follow-up
router.post('/:id/schedule-followup', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.body;
    const User = (await import('../models/User')).default;
    const currentUser = await User.findById(req.user!.id);
    const agentName = currentUser?.name || 'Unknown';

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    lead.nextFollowUp = new Date(date);
    lead.lastActivity = new Date();
    if (lead.status === 'New Lead') lead.status = 'Working' as any;
    lead.activities.push({
      type: 'follow-up',
      description: `Follow-up scheduled for ${new Date(date).toISOString().split('T')[0]}`,
      timestamp: new Date(),
      agent: agentName,
    });

    await lead.save();

    // Create notification for follow-up scheduled
    await notifyFollowUpDue(lead._id.toString(), lead.name, new Date(date));

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/leads/:id — admin or leadgen
router.delete('/:id', auth, leadgenOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    emitLeadChange('deleted', { leadId: req.params.id });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/bulk-assign — assign multiple leads to an SDR
router.post('/bulk-assign', auth, leadgenOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { leadIds, agentName } = req.body;
    if (!Array.isArray(leadIds) || !leadIds.length || !agentName) {
      return res.status(400).json({ error: 'leadIds array and agentName are required' });
    }
    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      { $set: { assignedAgent: String(agentName) } }
    );
    emitLeadChange('bulk-assigned', { count: result.modifiedCount, agentName });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/bulk-delete — delete multiple leads at once
router.post('/bulk-delete', auth, leadgenOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || !leadIds.length) {
      return res.status(400).json({ error: 'leadIds array is required' });
    }
    const result = await Lead.deleteMany({ _id: { $in: leadIds } });
    emitLeadChange('bulk-deleted', { count: result.deletedCount });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
