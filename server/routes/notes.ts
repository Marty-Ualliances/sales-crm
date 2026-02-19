import { Router, Response } from 'express';
import Note from '../models/Note';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notes — get only the current user's notes
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const notes = await Note.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notes — create a note
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const note = await Note.create({ userId: req.user!.id, content: String(content).trim() });
    res.status(201).json(note);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notes/:id — update own note
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { content: String(content).trim() },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/notes/:id — delete own note
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
