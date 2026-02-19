import { useMemo, useState } from 'react';
import { Mic, MicOff, Play, Flag, Clock, User, Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCalls } from '@/hooks/useApi';

export default function CallRecordingsPage() {
    const { data: calls = [], isLoading } = useCalls();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'recorded' | 'flagged'>('all');

    const recordingCalls = useMemo(() => {
        let list = calls.filter((c: any) => c.hasRecording || c.recordingFlagged);

        if (filter === 'recorded') list = list.filter((c: any) => c.hasRecording);
        if (filter === 'flagged') list = list.filter((c: any) => c.recordingFlagged && !c.hasRecording);

        if (search) {
            const q = search.toLowerCase();
            list = list.filter((c: any) =>
                c.leadName?.toLowerCase().includes(q) ||
                c.agentName?.toLowerCase().includes(q) ||
                c.notes?.toLowerCase().includes(q)
            );
        }

        return list.sort((a: any, b: any) => {
            if (a.date === b.date) return a.time < b.time ? 1 : -1;
            return a.date < b.date ? 1 : -1;
        });
    }, [calls, search, filter]);

    const recorded = useMemo(() => calls.filter((c: any) => c.hasRecording).length, [calls]);
    const flagged = useMemo(() => calls.filter((c: any) => c.recordingFlagged && !c.hasRecording).length, [calls]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Call Recordings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {recorded} recorded · {flagged} flagged for recording
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 mb-3">
                        <Mic className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{recorded}</p>
                    <p className="text-sm text-muted-foreground mt-1">Recorded Calls</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950 mb-3">
                        <Flag className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{flagged}</p>
                    <p className="text-sm text-muted-foreground mt-1">Flagged (Pending)</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 mb-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{calls.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total Calls</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                    {(['all', 'recorded', 'flagged'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {f === 'all' ? 'All' : f === 'recorded' ? 'Recorded' : 'Flagged'}
                        </button>
                    ))}
                </div>
                <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search calls..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
                    />
                </div>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 shrink-0">
                        <Mic className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">Automatic Recording Flags</h3>
                        <p className="text-xs text-muted-foreground">
                            Calls are automatically flagged for recording when they exceed 5 minutes or when
                            the associated lead's status is <strong>Positive</strong>, <strong>Meeting Done</strong>,
                            or <strong>Closed</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Call list */}
            <div className="space-y-3">
                {recordingCalls.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-12 text-center">
                        <MicOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No recorded or flagged calls found</p>
                    </div>
                ) : (
                    recordingCalls.map((call: any) => (
                        <div key={call.id || call._id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-semibold text-foreground truncate">{call.leadName}</h3>
                                        {call.hasRecording ? (
                                            <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                                <Mic className="h-3 w-3 mr-1" /> Recorded
                                            </Badge>
                                        ) : call.recordingFlagged ? (
                                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                                <Flag className="h-3 w-3 mr-1" /> Flagged
                                            </Badge>
                                        ) : null}
                                        <Badge variant={call.status === 'Completed' ? 'default' : call.status === 'Missed' ? 'destructive' : 'secondary'} className="text-xs">
                                            {call.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {call.date} {call.time}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="h-3.5 w-3.5" />
                                            {call.agentName}
                                        </span>
                                        <span>{call.duration}</span>
                                    </div>
                                    {call.notes && (
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{call.notes}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {call.hasRecording && call.recordingUrl ? (
                                        <Button size="sm" variant="outline" className="text-xs gap-1" asChild>
                                            <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                                                <Play className="h-3.5 w-3.5" />
                                                Play
                                            </a>
                                        </Button>
                                    ) : call.hasRecording ? (
                                        <span className="text-xs text-muted-foreground">No URL</span>
                                    ) : (
                                        <span className="text-xs text-amber-600">Awaiting Recording</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
