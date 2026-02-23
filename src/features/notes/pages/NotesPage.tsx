'use client';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, StickyNote, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function NotesPage() {
  const { user } = useAuth();
  const { data: notes = [], isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const { toast } = useToast();

  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    try {
      await createNote.mutateAsync(newContent.trim());
      setNewContent('');
      toast({ title: 'Note saved' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await updateNote.mutateAsync({ id, content: editContent.trim() });
      setEditingId(null);
      toast({ title: 'Note updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote.mutateAsync(id);
      toast({ title: 'Note deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const startEdit = (note: any) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Notes</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Private — only you can see these notes</p>
        </div>
      </div>

      {/* New note composer */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <textarea
          placeholder="Write a note..."
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          rows={3}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreate();
          }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">Ctrl+Enter to save</span>
          <Button
            size="sm"
            className="gradient-primary border-0"
            onClick={handleCreate}
            disabled={!newContent.trim() || createNote.isPending}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {createNote.isPending ? 'Saving...' : 'Add Note'}
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <StickyNote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No notes yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your private notes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note: any) => (
            <div key={note.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="gradient-primary border-0"
                      onClick={() => handleUpdate(note.id)}
                      disabled={updateNote.isPending}
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {updateNote.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(note)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(note.id)}
                        disabled={deleteNote.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
