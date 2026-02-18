import { Users, Phone, AlertTriangle, Clock, CheckCircle, Loader2, Target } from 'lucide-react';
import KPICard from '@/components/KPICard';
import LeadTable from '@/components/LeadTable';
import { useLeads, useCalls, useAgents } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';

export default function SDRDashboard() {
  const { user } = useAuth();
  const { data: allLeads = [], isLoading: leadsLoading } = useLeads();
  const { data: allCalls = [] } = useCalls();
  const { data: agents = [] } = useAgents();
  const agent = agents.find((a: any) => a.name === user?.name);

  // Filter to only this SDR's data
  const leads = allLeads.filter((l: any) => !l.assignedAgent || l.assignedAgent === user?.name);
  const calls = allCalls.filter((c: any) => c.agentName === user?.name);

  const today = new Date();
  const overdueFollowUps = leads.filter((l: any) =>
    l.nextFollowUp && new Date(l.nextFollowUp) < today && l.status !== 'Closed' && l.status !== 'Lost'
  ).length;
  const pendingFollowUps = leads.filter((l: any) =>
    l.nextFollowUp && l.status !== 'Closed' && l.status !== 'Lost'
  ).length;

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-foreground shimmer-text">Welcome back, {user?.name?.split(' ')[0] || 'Agent'}!</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your personal performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-slide-up stagger-1"><KPICard title="My Leads" value={leads.length} icon={Users} link="/sdr/leads" /></div>
        <div className="animate-slide-up stagger-2"><KPICard title="My Calls" value={calls.length} icon={Phone} link="/sdr/calls" /></div>
        <div className="animate-slide-up stagger-3">
          <KPICard
            title="Follow-ups Due"
            value={pendingFollowUps}
            icon={AlertTriangle}
            variant={overdueFollowUps > 0 ? 'danger' : 'default'}
            subtitle={`${overdueFollowUps} overdue`}
            link="/sdr/follow-ups"
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <KPICard
            title="Tasks Complete"
            value={agent?.followUpsCompleted || 0}
            icon={Target}
            variant="success"
          />
        </div>
      </div>

      {/* Personal stats */}
      {agent && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-slide-in-right glow-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">My Performance</h2>
          <div className="grid grid-cols-3 gap-4 auto-rows-fr">
            <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105 cursor-default flex flex-col items-center justify-center">
              <Phone className="h-5 w-5 mb-2 text-primary animate-float" />
              <p className="text-2xl font-bold text-foreground">{agent.callsMade}</p>
              <p className="text-xs text-muted-foreground">Calls Made</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105 cursor-default flex flex-col items-center justify-center">
              <CheckCircle className="h-5 w-5 mb-2 text-success animate-float" />
              <p className="text-2xl font-bold text-foreground">{agent.followUpsCompleted}</p>
              <p className="text-xs text-muted-foreground">Follow-ups Done</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105 cursor-default flex flex-col items-center justify-center">
              <Clock className="h-5 w-5 mb-2 text-warning animate-float" />
              <p className="text-2xl font-bold text-foreground">{agent.followUpsPending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's tasks */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Today's Tasks</h2>
        <div className="space-y-3">
          {leads
            .filter((l: any) => l.nextFollowUp && l.status !== 'Closed' && l.status !== 'Lost')
            .sort((a: any, b: any) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime())
            .slice(0, 5)
            .map(lead => {
              const isOverdue = new Date(lead.nextFollowUp!) < today;
              return (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${isOverdue ? 'bg-destructive' : 'bg-success'}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      {lead.phone ? (
                        <a href={`tel:${lead.phone.replace(/[^+\d]/g, '')}`} className="text-xs text-primary hover:underline">{lead.phone}</a>
                      ) : (
                        <p className="text-xs text-muted-foreground">No phone</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isOverdue ? 'Overdue' : 'Due'}: {lead.nextFollowUp}
                    </p>
                    <p className="text-xs text-muted-foreground">{lead.status}</p>
                  </div>
                </div>
              );
            })}
          {leads.filter((l: any) => l.nextFollowUp && l.status !== 'Closed' && l.status !== 'Lost').length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No pending follow-ups. Great job!</p>
          )}
        </div>
      </div>

      {/* My Leads Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">My Leads</h2>
          <span className="text-sm text-muted-foreground">{leads.length} leads</span>
        </div>
        <LeadTable leads={leads} />
      </div>
    </div>
  );
}
