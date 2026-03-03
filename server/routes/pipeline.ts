import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import PipelineStage from '../models/PipelineStage.js';
import { authenticateToken, checkPermission, authorize, AuthRequest } from '../middleware/auth.js';
import { emitLeadChangedToRoles } from '../socket.js';

/** Escape special regex characters to prevent ReDoS */
function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const router = Router();

// ── Helper: populate lead refs ──
const LEAD_POPULATE = [
    { path: 'assignedTo', select: 'name email avatar role' },
    { path: 'uploadedBy', select: 'name email' },
    { path: 'pipelineStage', select: 'name color order probability' },
];

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/pipeline/stages — all active stages sorted by order
// ════════════════════════════════════════════════════════════════════════════════
router.get('/stages', authenticateToken, async (_req: AuthRequest, res: Response) => {
    try {
        const stages = await PipelineStage.find({ isActive: true }).sort({ order: 1 }).lean();
        res.json(stages);
    } catch (err) {
        console.error('GET /api/pipeline/stages error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/pipeline/board — KANBAN ENDPOINT: leads grouped by stage
// ════════════════════════════════════════════════════════════════════════════════
router.get('/board', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user!.role;
        const { assignedTo, search, dateFrom, dateTo } = req.query as Record<string, string>;

        // Build match filter
        const matchFilter: Record<string, any> = { isDeleted: { $ne: true } };

        // Role-based visibility
        if (role === 'sdr' || role === 'closer') {
            matchFilter.assignedTo = new mongoose.Types.ObjectId(req.user!.id);
        } else if (assignedTo) {
            matchFilter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
        }

        if (search) {
            const s = escapeRegex(String(search));
            matchFilter.$or = [
                { firstName: { $regex: s, $options: 'i' } },
                { lastName: { $regex: s, $options: 'i' } },
                { company: { $regex: s, $options: 'i' } },
            ];
        }
        if (dateFrom || dateTo) {
            matchFilter.createdAt = {};
            if (dateFrom) matchFilter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) matchFilter.createdAt.$lte = new Date(dateTo);
        }

        // Get all active stages
        const stages = await PipelineStage.find({ isActive: true }).sort({ order: 1 }).lean();

        // Get leads grouped by pipelineStage
        const pipeline = [
            { $match: matchFilter },
            {
                $group: {
                    _id: '$pipelineStage',
                    leads: {
                        $push: {
                            _id: '$_id',
                            firstName: '$firstName',
                            lastName: '$lastName',
                            company: '$company',
                            companyName: '$company',
                            email: '$email',
                            phone: '$phone',
                            dealValue: '$dealValue',
                            status: '$status',
                            pipelineStage: '$pipelineStage',
                            assignedTo: '$assignedTo',
                            updatedAt: '$updatedAt',
                            createdAt: '$createdAt',
                            __v: '$__v',
                        },
                    },
                    count: { $sum: 1 },
                    totalValue: { $sum: '$dealValue' },
                },
            },
        ];

        const grouped = await Lead.aggregate(pipeline);

        // Populate assignedTo for each lead
        const groupMap = new Map(grouped.map((g: any) => [g._id?.toString(), g]));

        const board = await Promise.all(
            stages.map(async (stage) => {
                const group = groupMap.get(stage._id.toString()) || { leads: [], count: 0, totalValue: 0 };

                // Populate assignedTo in the group leads
                const leadsWithPopulate = await Lead.populate(group.leads, {
                    path: 'assignedTo',
                    select: 'name email avatar',
                });

                return {
                    _id: stage._id,
                    name: stage.name,
                    color: stage.color,
                    order: stage.order,
                    probability: stage.probability,
                    leads: leadsWithPopulate,
                    count: group.count,
                    totalValue: group.totalValue,
                };
            })
        );

        res.json(board);
    } catch (err) {
        console.error('GET /api/pipeline/board error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// PATCH /api/leads/:id/stage — THE KEY ENDPOINT: move lead between stages
// ════════════════════════════════════════════════════════════════════════════════
router.patch('/leads/:id/stage', authenticateToken, checkPermission('leads', 'moveStage'), async (req: AuthRequest, res: Response) => {
    try {
        const { stageId, dealValue, lostReason, expectedCloseDate } = req.body;

        if (!stageId) return res.status(400).json({ error: 'stageId is required' });

        // Validate stage exists
        const newStage = await PipelineStage.findById(stageId);
        if (!newStage || !newStage.isActive) {
            return res.status(404).json({ error: 'Pipeline stage not found' });
        }

        const lead = await Lead.findById(req.params.id).populate('pipelineStage', 'name');
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        const fromStageName = (lead.pipelineStage as any)?.name || 'Unknown';
        const toStageName = newStage.name;

        // Validation rules
        if (toStageName === 'Won') {
            const value = dealValue ?? lead.dealValue;
            if (!value || value <= 0) {
                return res.status(400).json({ error: 'dealValue must be greater than 0 for Won stage' });
            }
            lead.dealValue = value;
            lead.wonDate = new Date();
            lead.status = 'won';
            if (expectedCloseDate) lead.expectedCloseDate = new Date(expectedCloseDate);
        } else if (toStageName === 'Lost') {
            if (!lostReason) {
                return res.status(400).json({ error: 'lostReason is required for Lost stage' });
            }
            lead.lostReason = lostReason;
            lead.status = 'lost';
        } else {
            // Map stage name to status
            const statusMap: Record<string, string> = {
                'New': 'new',
                'Contacted': 'contacted',
                'Qualified': 'qualified',
                'Proposal': 'proposal',
                'Negotiation': 'negotiation',
            };
            lead.status = (statusMap[toStageName] || lead.status) as any;
        }

        // Update amount if provided
        if (dealValue !== undefined && toStageName !== 'Won') {
            lead.dealValue = dealValue;
        }
        if (expectedCloseDate && toStageName !== 'Won') {
            lead.expectedCloseDate = new Date(expectedCloseDate);
        }

        lead.pipelineStage = newStage._id as mongoose.Types.ObjectId;
        await lead.save();

        // Log stage change activity
        await Activity.create({
            leadId: lead._id,
            userId: req.user!.id,
            type: 'stage_change',
            fromStage: fromStageName,
            toStage: toStageName,
            description: `Pipeline stage changed from "${fromStageName}" to "${toStageName}"`,
        });

        const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE);

        emitLeadChangedToRoles('stage_changed', {
            leadId: lead._id.toString(),
            assignedUserId: lead.assignedTo?.toString(),
            fromStage: fromStageName,
            toStage: toStageName,
        });

        res.json(populated);
    } catch (err: any) {
        if (err.name === 'VersionError') {
            return res.status(409).json({ error: 'Lead was modified by another user. Please refresh.' });
        }
        console.error('PATCH /api/pipeline/leads/:id/stage error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/pipeline/stages — create a stage (admin only)
// ════════════════════════════════════════════════════════════════════════════════
router.post('/stages', authenticateToken, authorize('admin'), async (req: AuthRequest, res: Response) => {
    try {
        const { name, order, color, probability, description } = req.body;
        if (!name || order === undefined) {
            return res.status(400).json({ error: 'name and order are required' });
        }

        const stage = await PipelineStage.create({ name, order, color, probability, description });
        res.status(201).json(stage);
    } catch (err: any) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'A stage with this name already exists' });
        }
        console.error('POST /api/pipeline/stages error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// PATCH /api/pipeline/stages/reorder — bulk update order (admin only)
// MUST be before /stages/:id to avoid route shadowing
// ════════════════════════════════════════════════════════════════════════════════
router.patch('/stages/reorder', authenticateToken, authorize('admin'), async (req: AuthRequest, res: Response) => {
    try {
        const { stages } = req.body; // [{ id, order }]
        if (!Array.isArray(stages)) {
            return res.status(400).json({ error: 'stages array is required' });
        }

        const bulkOps = stages.map((s: { id: string; order: number }) => ({
            updateOne: {
                filter: { _id: s.id },
                update: { $set: { order: s.order } },
            },
        }));

        await PipelineStage.bulkWrite(bulkOps);
        const updated = await PipelineStage.find({ isActive: true }).sort({ order: 1 }).lean();
        res.json(updated);
    } catch (err) {
        console.error('PATCH /api/pipeline/stages/reorder error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ════════════════════════════════════════════════════════════════════════════════
// PATCH /api/pipeline/stages/:id — update a stage (admin only)
// ════════════════════════════════════════════════════════════════════════════════
router.patch('/stages/:id', authenticateToken, authorize('admin'), async (req: AuthRequest, res: Response) => {
    try {
        const { name, order, color, probability, description, isActive } = req.body;
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (order !== undefined) updates.order = order;
        if (color !== undefined) updates.color = color;
        if (probability !== undefined) updates.probability = probability;
        if (description !== undefined) updates.description = description;
        if (isActive !== undefined) updates.isActive = isActive;

        const stage = await PipelineStage.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!stage) return res.status(404).json({ error: 'Stage not found' });
        res.json(stage);
    } catch (err) {
        console.error('PATCH /api/pipeline/stages/:id error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
