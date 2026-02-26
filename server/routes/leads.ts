import { Router, Response } from 'express';
import multer from 'multer';
import Lead from '../models/Lead';
import { auth, adminOnly, leadgenOrAdmin, AuthRequest } from '../middleware/auth';
import { notifyLeadStatusChange, notifyNewLead, notifyFollowUpDue, notifyLeadImported } from '../utils/notificationHelper';
import { getIO } from '../socket';

import * as XLSX from 'xlsx';

function emitLeadChange(action: string, data?: any) {
  try { getIO().emit('lead:changed', { action, ...(data || {}) }); } catch (_) { }
}

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.tsv', '.txt', '.xlsx', '.xls'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!allowed.includes(ext)) {
      return cb(new Error('Supported formats: .csv, .tsv, .xlsx, .xls'));
    }
    cb(null, true);
  },
});

// ── Column name → model field mapping (fuzzy - handles many variations) ──
const CSV_FIELD_MAP: Record<string, string> = {
  // Name variations
  'date': 'date', 'added date': 'date', 'created': 'date', 'created date': 'date',
  'source': 'source', 'lead source': 'source',
  'name': 'name', 'full name': 'name', 'contact name': 'name', 'lead name': 'name', 'first name': 'name', 'fullname': 'name',
  'title': 'title', 'job title': 'title', 'position': 'title', 'role': 'title', 'designation': 'title',
  // Company
  'company name': 'companyName', 'company': 'companyName', 'organization': 'companyName', 'org': 'companyName', 'firm': 'companyName', 'employer': 'companyName',
  // Contact
  'email': 'email', 'email address': 'email', 'e-mail': 'email', 'emailaddress': 'email',
  'work direct phone': 'workDirectPhone', 'work phone': 'workDirectPhone', 'direct phone': 'workDirectPhone', 'office phone': 'workDirectPhone', 'business phone': 'workDirectPhone',
  'phone': 'workDirectPhone', 'phone number': 'workDirectPhone', 'telephone': 'workDirectPhone', 'tel': 'workDirectPhone',
  'home phone': 'homePhone', 'home phone number': 'homePhone',
  'mobile phone': 'mobilePhone', 'mobile': 'mobilePhone', 'cell': 'mobilePhone', 'cell phone': 'mobilePhone', 'cellphone': 'mobilePhone',
  'corporate phone': 'corporatePhone',
  'other phone': 'otherPhone',
  'company phone': 'companyPhone',
  // Numbers
  'employees': 'employees', '# employees': 'employees', 'number of employees': 'employees', 'num employees': 'employees', 'employee count': 'employees', 'company size': 'employees',
  // URLs
  'person linkedin url': 'personLinkedinUrl', 'linkedin': 'personLinkedinUrl', 'linkedin url': 'personLinkedinUrl', 'linkedin profile': 'personLinkedinUrl',
  'website': 'website', 'company website': 'website', 'url': 'website', 'web': 'website',
  'company linkedin url': 'companyLinkedinUrl', 'company linkedin': 'companyLinkedinUrl',
  // Location
  'city': 'city', 'town': 'city',
  'state': 'state', 'province': 'state', 'region': 'state',
  'address': 'address', 'street': 'address', 'street address': 'address',
  // Assignment
  'assigned': 'assignedAgent', 'assigned agent': 'assignedAgent', 'agent': 'assignedAgent', 'owner': 'assignedAgent', 'rep': 'assignedAgent', 'sales rep': 'assignedAgent',
  'status': 'status', 'lead status': 'status', 'stage': 'status',
  'notes': 'notes', 'note': 'notes', 'comments': 'notes', 'comment': 'notes', 'description': 'notes',
  'follow-up date': 'nextFollowUp', 'follow up date': 'nextFollowUp', 'followup': 'nextFollowUp', 'next follow up': 'nextFollowUp',
};

// Valid enum values
const VALID_SOURCES = ['CSV Import', 'Manual', 'Website', 'Referral', 'LinkedIn', 'Cold – High Fit', 'Warm – Engaged', 'Cold – Quick Sourced', 'Cold – Bulk Data', 'Other'];
const VALID_STATUSES = ['New Lead', 'Working', 'Connected', 'Qualified', 'Meeting Booked', 'Meeting Completed', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost', 'Nurture'];

/** Parse any uploaded file (xlsx, xls, csv, tsv) into an array of row objects */
function parseSpreadsheet(buffer: Buffer, filename: string): { headers: string[]; rows: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, dateNF: 'yyyy-mm-dd' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

  if (jsonData.length < 2) return { headers: [], rows: [] };

  const headers = jsonData[0].map((h: any) => String(h || '').trim());
  const rows = jsonData.slice(1)
    .filter(row => row.some((cell: any) => String(cell || '').trim() !== ''))
    .map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = String(row[i] || '').trim();
      });
      return obj;
    });

  return { headers, rows };
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
      const count = leads.filter((l: any) => l.status === s).length;
      return { stage: s, label: s, count, pct: Math.round((count / total) * 100) };
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

// POST /api/leads/import — bulk import (CSV, TSV, Excel)
router.post('/import', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Parse file using SheetJS (handles xlsx, xls, csv, tsv automatically)
    const { headers, rows } = parseSpreadsheet(req.file.buffer, req.file.originalname);
    console.log(`[Import] File: ${req.file.originalname}, Headers: [${headers.join(', ')}], Rows: ${rows.length}`);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'File has no data rows' });
    }

    // Map headers to model fields with robust substring/fuzzy matching
    const headerMap: Record<string, string | null> = {};
    const unmappedHeaders: string[] = [];

    // All valid schema fields to map
    const VALID_FIELDS = [
      'date', 'source', 'name', 'title', 'companyName', 'email', 'workDirectPhone',
      'homePhone', 'mobilePhone', 'corporatePhone', 'otherPhone', 'companyPhone',
      'employees', 'personLinkedinUrl', 'website', 'companyLinkedinUrl', 'address',
      'city', 'state', 'status', 'assignedAgent', 'notes', 'nextFollowUp',
      'priority', 'segment', 'sourceChannel'
    ];

    headers.forEach(h => {
      if (!h.trim()) return;
      const cleanKey = h.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
      const noSpaceKey = cleanKey.replace(/\s/g, '');

      let mappedField = CSV_FIELD_MAP[cleanKey] || CSV_FIELD_MAP[noSpaceKey] || null;

      // Try exact schema match
      if (!mappedField) {
        const exactMatch = VALID_FIELDS.find(f => f.toLowerCase() === noSpaceKey);
        if (exactMatch) mappedField = exactMatch;
      }

      // Robust partial matches for critical fields
      if (!mappedField) {
        if (cleanKey.includes('email')) mappedField = 'email';
        else if (cleanKey.includes('company') && (cleanKey.includes('name') || noSpaceKey === 'company')) mappedField = 'companyName';
        else if (cleanKey.includes('first') || cleanKey.includes('last') || cleanKey.includes('name')) mappedField = 'name';
        else if (cleanKey.includes('title') || cleanKey.includes('role')) mappedField = 'title';
        else if (cleanKey.includes('mobile') || cleanKey.includes('cell')) mappedField = 'mobilePhone';
        else if (cleanKey.includes('phone') || cleanKey.includes('tel')) {
          if (cleanKey.includes('company') || cleanKey.includes('office') || cleanKey.includes('biz')) mappedField = 'companyPhone';
          else if (cleanKey.includes('home')) mappedField = 'homePhone';
          else mappedField = 'workDirectPhone';
        }
        else if (cleanKey.includes('linkedin')) {
          if (cleanKey.includes('company')) mappedField = 'companyLinkedinUrl';
          else mappedField = 'personLinkedinUrl';
        }
        else if (cleanKey.includes('web') || cleanKey.includes('url')) mappedField = 'website';
        else if (cleanKey.includes('address') || cleanKey.includes('street')) mappedField = 'address';
        else if (cleanKey.includes('city')) mappedField = 'city';
        else if (cleanKey.includes('state') || cleanKey.includes('province')) mappedField = 'state';
        else if (cleanKey.includes('employee') || cleanKey.includes('size')) mappedField = 'employees';
        else if (cleanKey.includes('note') || cleanKey.includes('comment')) mappedField = 'notes';
        else if (cleanKey.includes('status') || cleanKey.includes('stage')) mappedField = 'status';
        else if (cleanKey.includes('agent') || cleanKey.includes('owner') || cleanKey.includes('rep') || cleanKey.includes('assign')) mappedField = 'assignedAgent';
      }

      headerMap[h] = mappedField;
      if (!mappedField) unmappedHeaders.push(h);
    });

    console.log(`[Import] Mapped: ${Object.values(headerMap).filter(Boolean).length}/${headers.length} columns. Unmapped: [${unmappedHeaders.join(', ')}]`);

    // Get current user for default agent assignment
    const User = (await import('../models/User')).default;
    const currentUser = await User.findById(req.user!.id);
    const defaultAgent = currentUser?.name || 'Unassigned';

    const imported: any[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

        // Build document with safe defaults for ALL enum fields
        const doc: any = {
          date: new Date(),
          source: 'CSV Import',
          status: 'New Lead',
          assignedAgent: defaultAgent,
          addedBy: defaultAgent,
          // Explicitly set ALL enum fields to prevent validation errors
          priority: 'C',
          segment: '',
          sourceChannel: '',
          qualityGatePass: false,
        };

        // Map known columns from the spreadsheet
        for (const [header, value] of Object.entries(row)) {
          const field = headerMap[header];
          if (!field || !value) continue;

          const v = String(value).trim();
          if (!v) continue;

          if (field === 'employees') {
            const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num)) doc[field] = num;
          } else if (field === 'nextFollowUp' || field === 'date') {
            const d = new Date(v);
            if (!isNaN(d.getTime())) doc[field] = d;
          } else {
            doc[field] = v;
          }
        }

        // Collect data from unknown columns → notes
        const extraFields: string[] = [];
        for (const header of unmappedHeaders) {
          const val = row[header];
          if (val && String(val).trim()) extraFields.push(`${header}: ${String(val).trim()}`);
        }
        if (extraFields.length > 0) {
          doc.notes = (doc.notes || '') + (doc.notes ? '\n' : '') + extraFields.join(' | ');
        }

        // ── SANITIZE ALL ENUM FIELDS ──
        // Name: REQUIRED — must be non-empty
        if (!doc.name || !String(doc.name).trim()) {
          doc.name = doc.email || doc.companyName || doc.title || `Lead Row ${i + 2}`;
        }
        doc.name = String(doc.name).trim().substring(0, 200);

        // Source: must be a valid enum value
        if (!VALID_SOURCES.includes(doc.source)) {
          if (doc.source) doc.notes = (doc.notes || '') + `\nOriginal source: ${doc.source}`;
          doc.source = 'CSV Import';
        }

        // Status: must be a valid enum value
        if (!VALID_STATUSES.includes(doc.status)) {
          if (doc.status) doc.notes = (doc.notes || '') + `\nOriginal status: ${doc.status}`;
          doc.status = 'New Lead';
        }

        // Priority: must be A, B, or C
        if (!['A', 'B', 'C'].includes(doc.priority)) {
          doc.priority = 'C';
        }

        // Segment: must be valid enum or empty
        const VALID_SEGMENTS = ['Insurance', 'Accounting', 'Finance', 'Healthcare', 'Legal', 'Other', ''];
        if (!VALID_SEGMENTS.includes(doc.segment || '')) {
          doc.segment = '';
        }

        // Activities and stageHistory
        doc.activities = [{ type: 'note', description: 'Lead imported via CSV', timestamp: new Date(), agent: defaultAgent }];
        doc.stageHistory = [{ stage: doc.status, enteredAt: new Date(), agent: defaultAgent }];

        // Save with try/catch — if it STILL fails, retry with minimal doc
        try {
          const lead = new Lead(doc);
          await lead.save();
          imported.push(lead);
        } catch (saveErr: any) {
          console.error(`[Import] Row ${i + 2} save failed: ${saveErr.message} — retrying with minimal doc`);
          // Retry with absolute minimum fields
          try {
            const minimalDoc = {
              name: doc.name || `Lead Row ${i + 2}`,
              assignedAgent: defaultAgent,
              addedBy: defaultAgent,
              source: 'CSV Import',
              status: 'New Lead',
              date: new Date(),
              priority: 'C',
              segment: '',
              email: doc.email || '',
              companyName: doc.companyName || '',
              title: doc.title || '',
              notes: `Import retry — original save failed: ${saveErr.message}\n${doc.notes || ''}`,
              activities: [{ type: 'note', description: 'Lead imported via CSV (retry)', timestamp: new Date(), agent: defaultAgent }],
              stageHistory: [{ stage: 'New Lead', enteredAt: new Date(), agent: defaultAgent }],
            };
            const retryLead = new Lead(minimalDoc);
            await retryLead.save();
            imported.push(retryLead);
          } catch (retryErr: any) {
            console.error(`[Import] Row ${i + 2} retry also failed: ${retryErr.message}`);
            errors.push({ row: i + 2, error: saveErr.message });
          }
        }
      } catch (e: any) {
        console.error(`[Import] Row ${i + 2} parse error:`, e.message);
        errors.push({ row: i + 2, error: e.message });
      }
    }

    // Create notification for successful import (scoped to this user)
    if (imported.length > 0) {
      await notifyLeadImported(imported.length, req.user!.id);
      emitLeadChange('imported', { count: imported.length });
    }

    console.log(`[Import] Done: ${imported.length} imported, ${errors.length} errors out of ${rows.length} rows`);

    res.json({
      imported: imported.length,
      errors: errors.length,
      skipped: 0,
      errorDetails: errors.slice(0, 50),
      total: rows.length,
    });
  } catch (err: any) {
    console.error('Import error:', err);
    res.status(500).json({ error: `Import failed: ${err.message}` });
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

    // Create notification for status change (scoped to this user)
    if (oldLead && req.body.status && oldLead.status !== req.body.status) {
      await notifyLeadStatusChange(lead._id.toString(), lead.name, oldLead.status, req.body.status, req.user!.id);
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

    // Create notification for follow-up scheduled (scoped to this user)
    await notifyFollowUpDue(lead._id.toString(), lead.name, new Date(date), req.user!.id);

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
