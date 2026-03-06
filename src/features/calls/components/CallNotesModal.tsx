'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CallNotesModalProps {
  open: boolean;
  leadName: string;
  callId: string;
  onSave: (notes: string) => Promise<void>;
  onClose: () => void;
}

export function CallNotesModal({ open, leadName, callId, onSave, onClose }: CallNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(notes);
      setNotes('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Call Notes</DialogTitle>
          <DialogDescription>
            Add notes for your call with <span className="font-semibold text-foreground">{leadName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter call notes — what was discussed, next steps, etc."
            rows={5}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Skip
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Notes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
