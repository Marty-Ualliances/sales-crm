import { useLeads, useCompleteFollowUp, useCreateCall } from '@/hooks/useApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertTriangle, Phone, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function MyFollowUpsPage() {
  const { data: allLeads = [], isLoading } = useLeads();
  const { user } = useAuth();
  const completeFollowUp = useCompleteFollowUp();
  const createCall = useCreateCall();
  const today = new Date();
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');

  // Only this SDR's leads
  const leads = allLeads.filter((l: any) => !l.assignedAgent || l.assignedAgent === user?.name);

  const handleMarkDone = async (leadId: string, leadName: string) => {
    try {
      await completeFollowUp.mutateAsync(leadId);
      toast.success(`Follow-up with ${leadName} marked as done`);
    } catch {
      toast.error('Failed to mark follow-up as done');
    }
  };

  const handleCallNow = async (lead: any) => {
    // Log the call and open phone dialer
    try {
      const phone = lead.workDirectPhone || lead.mobilePhone || lead.phone || '';
      if (phone) {
        window.open(`tel:${phone.replace(/[^+\d]/g, '')}`, '_self');
      }
      await createCall.mutateAsync({
        leadId: lead.id,
        leadName: lead.name,
        agentName: user?.name || 'Unknown',
        date: new Date(),
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        duration: '0 min',
        status: 'Completed',
        notes: 'Call initiated from follow-ups',
        hasRecording: false,
      });
      toast.success(`Call to ${lead.name} logged`);
    } catch {
      toast.error('Failed to log call');
    }
  };

  const myFollowUps = leads
    .filter((l: any) => l.nextFollowUp && l.status !== 'Closed Won' && l.status !== 'Closed Lost')
    .map(l => ({
      ...l,
      isOverdue: new Date(l.nextFollowUp!) < today,
      daysUntil: Math.ceil((new Date(l.nextFollowUp!).getTime() - today.getTime()) / 86400000),
    }))
    .sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());

  const filtered = myFollowUps.filter(f => {
    if (filter === 'overdue') return f.isOverdue;
    if (filter === 'upcoming') return !f.isOverdue;
    return true;
  });

  const overdueCount = myFollowUps.filter(f => f.isOverdue).length;
  const upcomingCount = myFollowUps.filter(f => !f.isOverdue).length;

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
        <h1 className="text-2xl font-bold text-foreground">My Follow-ups</h1>
        <p className="text-sm text-muted-foreground mt-1">{myFollowUps.length} follow-ups pending</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card text-center">
          <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-foreground">{myFollowUps.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-destructive" />
          <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card text-center">
          <CheckCircle className="h-5 w-5 mx-auto mb-2 text-success" />
          <p className="text-2xl font-bold text-success">{upcomingCount}</p>
          <p className="text-xs text-muted-foreground">Upcoming</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          All ({myFollowUps.length})
        </Button>
        <Button variant={filter === 'overdue' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('overdue')}>
          Overdue ({overdueCount})
        </Button>
        <Button variant={filter === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('upcoming')}>
          Upcoming ({upcomingCount})
        </Button>
      </div>

      {/* Follow-up list */}
      <div className="space-y-3">
        {filtered.map(lead => (
          <div key={lead.id} className="rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${lead.isOverdue ? 'bg-destructive animate-pulse' : 'bg-success'}`} />
                <div>
                  <p className="font-medium text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.phone ? (
                      <button onClick={() => handleCallNow(lead)} className="text-primary hover:underline">{lead.phone}</button>
                    ) : 'No phone'}
                    {' · '}{lead.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-medium ${lead.isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                    {lead.nextFollowUp}
                  </p>
                  <p className={`text-xs ${lead.isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {lead.isOverdue
                      ? `${Math.abs(lead.daysUntil)} day${Math.abs(lead.daysUntil) !== 1 ? 's' : ''} overdue`
                      : lead.daysUntil === 0
                        ? 'Due today'
                        : `In ${lead.daysUntil} day${lead.daysUntil !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <Badge variant={lead.isOverdue ? 'destructive' : 'secondary'} className="text-xs">
                  {lead.status}
                </Badge>
              </div>
            </div>
            {lead.notes && (
              <p className="mt-2 text-xs text-muted-foreground ml-6">{lead.notes}</p>
            )}
            <div className="mt-3 ml-6 flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleCallNow(lead)}>
                <Phone className="h-3 w-3" />
                Call Now
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleMarkDone(lead.id, lead.name)}
                disabled={completeFollowUp.isPending}>
                <CheckCircle className="h-3 w-3" />
                Mark Done
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-sm text-muted-foreground">No follow-ups in this view. Nice work!</p>
          </div>
        )}
      </div>
    </div>
  );
}
