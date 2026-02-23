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

        let filter: any = {};
        if (user.role === 'sdr' || user.role === 'leadgen') {
            filter.agentName = user.name;
        }

        // Aggregate total emails sent
        const allRecords = await Outreach.find(filter);
        const totalEmails = allRecords.reduce((sum, r) => sum + r.emailsSent, 0);

        // Get today's emails sent
        const todayRecord = allRecords.find(r => r.date === todayStr);
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

        if (typeof count !== 'number' || count < 0) {
            return res.status(400).json({ error: 'Invalid count' });
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
