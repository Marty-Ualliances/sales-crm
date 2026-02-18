import { Router, Response } from 'express';
import multer from 'multer';
import Lead from '../models/Lead';
import { auth, adminOnly, AuthRequest } from '../middleware/auth';
import { notifyLeadStatusChange, notifyNewLead, notifyFollowUpDue, notifyLeadImported } from '../utils/notificationHelper';

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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
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
    const followUpsRemaining = leads.filter(l => l.nextFollowUp && l.status !== 'Closed' && l.status !== 'Lost').length;
    const overdueFollowUps = leads.filter(l => l.nextFollowUp && l.nextFollowUp < today && l.status !== 'Closed' && l.status !== 'Lost').length;
    const closedCount = leads.filter(l => l.status === 'Closed').length;
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0;
    const totalRevenue = leads.reduce((sum, l) => sum + (l.revenue || 0), 0);

    res.json({
      totalLeads,
      totalCalls,
      recentActivity,
      followUpsRemaining,
      overdueFollowUps,
      appointmentsBooked: 12,
      conversionRate,
      totalRevenue,
    });
  } catch (err) {
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
    const lead = new Lead(req.body);
    await lead.save();

    // Create notification for new lead
    await notifyNewLead(lead._id.toString(), lead.name, lead.assignedAgent);

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/import — CSV bulk import
router.post('/import', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = req.file.buffer.toString('utf-8');
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: 'CSV must have a header row and at least one data row' });

    const rawHeaders = parseCSVLine(lines[0]);
    const headerMap = rawHeaders.map(h => {
      const key = h.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      return CSV_FIELD_MAP[key] || null;
    });

    // Get current user for default agent assignment
    const User = (await import('../models/User')).default;
    const currentUser = await User.findById(req.user!.id);
    const defaultAgent = currentUser?.name || 'Unassigned';

    const imported: any[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const vals = parseCSVLine(lines[i]);
        const doc: any = {
          source: 'CSV Import',
          date: new Date(),
          assignedAgent: defaultAgent,
          status: 'New',
        };

        headerMap.forEach((field, idx) => {
          if (!field || !vals[idx]) return;
          const v = vals[idx].replace(/^"|"$/g, '');
          if (field === 'employees') {
            doc[field] = parseInt(v, 10) || null;
          } else if (field === 'nextFollowUp' || field === 'date') {
            const d = new Date(v);
            if (!isNaN(d.getTime())) doc[field] = d;
          } else {
            doc[field] = v;
          }
        });

        if (!doc.name) { errors.push({ row: i + 1, error: 'Missing name' }); continue; }

        doc.activities = [{ type: 'note', description: 'Lead imported via CSV', timestamp: new Date(), agent: defaultAgent }];
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
    }

    res.json({
      imported: imported.length,
      errors: errors.length,
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
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Create notification for status change
    if (oldLead && req.body.status && oldLead.status !== req.body.status) {
      await notifyLeadStatusChange(lead._id.toString(), lead.name, oldLead.status, req.body.status);
    }

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
    if (lead.status === 'New') lead.status = 'Contacted';

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
    if (lead.status === 'New') lead.status = 'Follow-up';
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

// DELETE /api/leads/:id
router.delete('/:id', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
