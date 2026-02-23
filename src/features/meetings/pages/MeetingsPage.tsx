import { useState, useMemo } from 'react';
import { Calendar, Plus, Trash2, Edit2, Loader2, Clock, User, Link2, X, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMeetings, useCreateMeeting, useDeleteMeeting, useUpdateMeeting, useLeads } from '@/hooks/useApi';

type MeetingFormData = {
    title: string;
    description: string;
    date: string;
    time: string;
    duration: number;
    leadId: string;
    leadName: string;
    agenda: string;
    confirmationSent: boolean;
    nextStep: string;
    outcome: string;
};

const emptyForm: MeetingFormData = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 30,
    leadId: '',
    leadName: '',
    agenda: '',
    confirmationSent: false,
    nextStep: '',
    outcome: '',
};

export default function MeetingsPage() {
    const { data: meetings = [], isLoading } = useMeetings();
    const { data: leads = [] } = useLeads();
    const createMeeting = useCreateMeeting();
    const deleteMeeting = useDeleteMeeting();
    const updateMeeting = useUpdateMeeting();

    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<MeetingFormData>({ ...emptyForm });
    const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');

    const today = new Date().toISOString().split('T')[0];

    const filtered = useMemo(() => {
        let list = [...meetings];
        if (filter === 'today') {
            list = list.filter((m: any) => m.date === today);
        } else if (filter === 'upcoming') {
            list = list.filter((m: any) => m.date >= today && m.status === 'scheduled');
        }
        return list.sort((a: any, b: any) => {
            if (a.date === b.date) return a.time < b.time ? -1 : 1;
            return a.date < b.date ? -1 : 1;
        });
    }, [meetings, filter, today]);

    const todayMeetings = useMemo(() => meetings.filter((m: any) => m.date === today), [meetings, today]);

    const handleSubmit = async () => {
        if (!form.title || !form.date || !form.time) return;
        // Find lead name if leadId selected
        let leadName = form.leadName;
        if (form.leadId) {
            const lead = leads.find((l: any) => l.id === form.leadId);
            leadName = lead?.name || '';
        }
        const payload = { ...form, leadName };
        if (editId) {
            await updateMeeting.mutateAsync({ id: editId, data: payload });
        } else {
            await createMeeting.mutateAsync(payload);
        }
        setForm({ ...emptyForm });
        setShowForm(false);
        setEditId(null);
    };

    const handleEdit = (meeting: any) => {
        setForm({
            title: meeting.title,
            description: meeting.description || '',
            date: meeting.date,
            time: meeting.time,
            duration: meeting.duration || 30,
            leadId: meeting.leadId || '',
            leadName: meeting.leadName || '',
            agenda: meeting.agenda || '',
            confirmationSent: meeting.confirmationSent || false,
            nextStep: meeting.nextStep || '',
            outcome: meeting.outcome || '',
        });
        setEditId(meeting.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this meeting?')) {
            await deleteMeeting.mutateAsync(id);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        await updateMeeting.mutateAsync({ id, data: { status } });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {todayMeetings.length} meeting{todayMeetings.length !== 1 ? 's' : ''} scheduled today
                    </p>
                </div>
                <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Meeting
                </Button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {(['all', 'today', 'upcoming'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        {f === 'all' ? 'All Meetings' : f === 'today' ? 'Today' : 'Upcoming'}
                    </button>
                ))}
            </div>

            {/* New/Edit form */}
            {showForm && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-foreground">{editId ? 'Edit Meeting' : 'Schedule New Meeting'}</h2>
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
                            <input
                                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Meeting title..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Date *</label>
                            <input
                                type="date"
                                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                                value={form.date}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Time *</label>
                            <input
                                type="time"
                                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                                value={form.time}
                                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Duration (min)</label>
                            <input
                                type="number"
                                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                                value={form.duration}
                                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) || 30 }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Attach Lead (optional)</label>
                            <select
                                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                                value={form.leadId}
                                onChange={e => setForm(f => ({ ...f, leadId: e.target.value }))}
                            >
                                <option value="">No lead attached</option>
                                {leads.map((l: any) => (
                                    <option key={l.id} value={l.id}>{l.name} — {l.companyName || l.email}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Description / Prep Notes</label>
                            <textarea
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Internal prep notes..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Agenda (sent to prospect)</label>
                            <textarea
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                                value={form.agenda}
                                onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                                placeholder="1. Introductions&#10;2. Pain points&#10;3. Solution overview&#10;4. Next steps..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="confirmationSent"
                                checked={form.confirmationSent}
                                onChange={e => setForm(f => ({ ...f, confirmationSent: e.target.checked }))}
                                className="h-4 w-4 rounded border-border text-primary"
                            />
                            <label htmlFor="confirmationSent" className="text-sm text-foreground cursor-pointer">
                                Confirmation email sent to prospect
                            </label>
                        </div>
                        {(editId) && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Next Step</label>
                                    <input
                                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                                        value={form.nextStep}
                                        onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
                                        placeholder="What happens after this meeting?"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Outcome / Notes</label>
                                    <textarea
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                                        value={form.outcome}
                                        onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                                        placeholder="What happened? What was agreed?"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex justify-end mt-4 gap-2">
                        <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={!form.title || !form.date || !form.time}>
                            {editId ? 'Update' : 'Schedule'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Meetings list */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-12 text-center">
                        <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No meetings found</p>
                    </div>
                ) : (
                    filtered.map((meeting: any) => (
                        <div key={meeting.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-semibold text-foreground truncate">{meeting.title}</h3>
                                        <Badge
                                            variant={meeting.status === 'completed' ? 'default' : meeting.status === 'cancelled' ? 'destructive' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {meeting.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {meeting.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {meeting.time} ({meeting.duration}min)
                                        </span>
                                        {meeting.createdByName && (
                                            <span className="flex items-center gap-1">
                                                <User className="h-3.5 w-3.5" />
                                                {meeting.createdByName}
                                            </span>
                                        )}
                                        {meeting.leadName && (
                                            <span className="flex items-center gap-1">
                                                <Link2 className="h-3.5 w-3.5" />
                                                Lead: {meeting.leadName}
                                            </span>
                                        )}
                                    </div>
                                    {meeting.description && (
                                        <p className="text-xs text-muted-foreground mt-2">{meeting.description}</p>
                                    )}
                                    {meeting.agenda && (
                                        <div className="mt-2 rounded-md bg-secondary/40 px-2.5 py-1.5">
                                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Agenda</p>
                                            <p className="text-xs text-foreground whitespace-pre-line">{meeting.agenda}</p>
                                        </div>
                                    )}
                                    {meeting.status === 'completed' && meeting.nextStep && (
                                        <div className="mt-2 flex items-start gap-1.5">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-foreground"><span className="font-medium">Next step:</span> {meeting.nextStep}</p>
                                        </div>
                                    )}
                                    {meeting.status === 'completed' && !meeting.nextStep && (
                                        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-2.5 py-1.5">
                                            <XCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">No next step recorded — edit to add one</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {meeting.status === 'scheduled' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusChange(meeting.id, 'completed')}
                                                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                                                title="Mark completed"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(meeting.id, 'cancelled')}
                                                className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                                                title="Cancel"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleEdit(meeting)}
                                        className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(meeting.id)}
                                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
