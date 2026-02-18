import { Router, Response } from 'express';
import Task from '../models/Task';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/tasks — list tasks (optionally filter by assignedTo, status, date range)
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { assignedTo, status, from, to, priority } = req.query;
    const filter: any = {};

    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (from || to) {
      filter.dueDate = {};
      if (from) filter.dueDate.$gte = new Date(from as string);
      if (to) filter.dueDate.$lte = new Date(to as string);
    }

    const tasks = await Task.find(filter).sort({ dueDate: 1, priority: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks — create task
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate, priority, assignedTo, leadId, leadName, category } = req.body;

    if (!title || !dueDate || !assignedTo) {
      return res.status(400).json({ error: 'Title, due date, and assigned agent are required' });
    }

    // Look up creator's name from their user ID
    const User = (await import('../models/User')).default;
    const creator = await User.findById(req.user!.id);

    const task = new Task({
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      dueDate,
      priority: priority || 'medium',
      status: 'todo',
      assignedTo: String(assignedTo).trim(),
      createdBy: creator?.name || 'Unknown',
      leadId: leadId || null,
      leadName: leadName ? String(leadName).trim() : '',
      category: category || 'other',
    });

    await task.save();
    res.status(201).json(task);
  } catch (err: any) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };

    // If marking as completed, set completedAt
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }
    // If un-completing, clear completedAt
    if (updates.status && updates.status !== 'completed') {
      updates.completedAt = null;
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
