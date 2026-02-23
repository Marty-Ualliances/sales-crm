import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeads, useCompleteFollowUp } from '@/hooks/useApi';
import { toast } from 'sonner';

export default function FollowUpsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const today = new Date().toISOString().split('T')[0];
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const completeFollowUp = useCompleteFollowUp();

  const followUpLeads = leads
    .filter((l: any) => l.nextFollowUp && l.status !== 'Closed Won' && l.status !== 'Closed Lost')
    .sort((a: any, b: any) => (a.nextFollowUp! > b.nextFollowUp! ? 1 : -1));

  const filtered = followUpLeads.filter(l => {
    if (filter === 'overdue') return l.nextFollowUp! < today;
    if (filter === 'today') return l.nextFollowUp === today;
    if (filter === 'upcoming') return l.nextFollowUp! > today;
    return true;
  });

  const overdueCount = followUpLeads.filter(l => l.nextFollowUp! < today).length;

  const handleComplete = async (leadId: string, leadName: string) => {
    try {
      await completeFollowUp.mutateAsync(leadId);
      toast.success(`Follow-up with ${leadName} completed`);
    } catch {
      toast.error('Failed to complete follow-up');
    }
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Follow-up Pending</h1>
        <p className="text-sm text-muted-foreground mt-1">{followUpLeads.length} follow-ups • {overdueCount} overdue</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'overdue', 'today', 'upcoming'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}
            className={filter === f && f === 'overdue' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
            {f === 'overdue' && <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'overdue' && overdueCount > 0 && <Badge variant="secondary" className="ml-1.5 text-xs h-5 px-1.5">{overdueCount}</Badge>}
          </Button>
        ))}
      </div>

      {/* Follow-up cards */}
      <div className="space-y-3">
        {filtered.map(lead => {
          const isOverdue = lead.nextFollowUp! < today;
          const isToday = lead.nextFollowUp === today;
          return (
            <div key={lead.id} className={`rounded-xl border bg-card p-4 shadow-card flex items-center justify-between gap-4 ${isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground'}`}>
                  {isOverdue ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.assignedAgent} • {lead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : isToday ? 'text-primary' : 'text-foreground'}`}>
                    {isOverdue ? 'OVERDUE' : isToday ? 'TODAY' : lead.nextFollowUp}
                  </p>
                  <p className="text-xs text-muted-foreground">{lead.nextFollowUp}</p>
                </div>
                <Button size="sm" variant={isOverdue ? 'destructive' : 'default'}
                  onClick={() => handleComplete(lead.id, lead.name)}
                  disabled={completeFollowUp.isPending}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  {completeFollowUp.isPending ? 'Completing...' : 'Complete'}
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No follow-ups in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
