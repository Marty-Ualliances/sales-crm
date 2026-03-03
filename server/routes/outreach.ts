import { Router, Response } from 'express';
import Outreach from '../models/Outreach';
import { auth, AuthRequest } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// Helper to get today's date string YYYY-MM-DD in local time
const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// GET /api/outreach — get total and today's email stats for the user (or all if Admin/HR)
router.get('/', auth, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const todayStr = getTodayStr();

        const filter: any = {};
        if (user.role === 'sdr' || user.role === 'lead_gen') {
            filter.agentName = user.name;
        }

        // Use aggregation instead of loading all records into memory
        const [totals] = await Outreach.aggregate([
            { $match: filter },
            { $group: { _id: null, totalEmails: { $sum: '$emailsSent' } } },
        ]);
        const totalEmails = totals?.totalEmails || 0;

        // Get today's emails sent
        const todayRecord = await Outreach.findOne({ ...filter, date: todayStr });
        const todayEmails = todayRecord ? todayRecord.emailsSent : 0;

        res.json({ totalEmails, todayEmails, todayDate: todayStr });
    } catch (err) {
        console.error('Outreach GET error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/outreach — add emails to today's count
router.post('/', auth, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { count } = req.body;

        if (typeof count !== 'number' || count < 0 || count > 10000) {
            return res.status(400).json({ error: 'Invalid count (must be 0–10,000)' });
        }

        const todayStr = getTodayStr();

        const record = await Outreach.findOneAndUpdate(
            { agentName: user.name, date: todayStr },
            { $inc: { emailsSent: count } },
            { new: true, upsert: true }
        );

        res.json(record);
    } catch (err) {
        console.error('Outreach POST error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
