'use client';
import { Users, Phone, AlertTriangle, Clock, CheckCircle, Loader2, Target, Calendar, Send, Linkedin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import KPICard from '@/components/common/KPICard';
import LeadTable from '@/components/common/LeadTable';
import { useLeads, useCalls, useAgents, useCreateCall } from '@/hooks/useApi';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getCadenceTasks, TOUCH_TYPE_CONFIG, CADENCE_TEMPLATES } from '@/features/leads/constants/cadences';
import DateFilter, { DateRange, filterByDateRange } from '@/components/common/DateFilter';
import { useState } from 'react';

export default function SDRDashboard() {
  const { user } = useAuth();
  const { data: allLeads = [], isLoading: leadsLoading } = useLeads();
  const { data: allCalls = [] } = useCalls();
  const { data: agents = [] } = useAgents();
  const createCall = useCreateCall();

  const [dateRange, setDateRange] = useState<DateRange>('last7days');

  const handleCall = async (lead: any) => {
    if (!lead.phone) {
      toast.error('No phone number available');
      return;
    }

    try {
      await createCall.mutateAsync({
        leadId: lead.id || lead._id,
        leadName: lead.name,
        agentName: user?.name || 'Unknown',
        date: new Date(),
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        duration: '0 min',
        status: 'Completed',
        notes: 'Call initiated from SDR Dashboard',
        hasRecording: false,
      });
      toast.success('Call logged');
    } catch (error) {
      console.error('Failed to log call:', error);
    }

    window.location.href = `tel:${lead.phone.replace(/[^+\d]/g, '')}`;
  };
  const agent = agents.find((a: any) => a.name === user?.name);

  // Filter strictly to this SDR's data
  const leads = allLeads.filter((l: any) => l.assignedAgent === user?.name);
  const calls = allCalls.filter((c: any) => c.agentName === user?.name);

  // Apply DateFilter to leads for KPI cards
  const filteredLeads = filterByDateRange(leads, dateRange);

  const today = new Date();
  const overdueFollowUps = leads.filter((l: any) =>
    l.nextFollowUp && new Date(l.nextFollowUp) < today && l.status !== 'Closed Won' && l.status !== 'Closed Lost'
  ).length;
  const pendingFollowUps = leads.filter((l: any) =>
    l.nextFollowUp && l.status !== 'Closed Won' && l.status !== 'Closed Lost'
  ).length;

  // Aggregate cadence tasks
  const allCadenceTasks = leads.flatMap((lead: any) => {
    if (!lead.cadence) return [];
    const { due, overdue } = getCadenceTasks(lead.cadence);
    const template = CADENCE_TEMPLATES.find(t => t.key === lead.cadence.type);

    return [
      ...overdue.map(t => ({ ...t, lead, status: 'overdue', source: 'cadence', label: template?.touches.find((_, i) => lead.cadence.touches[i] === t)?.label || 'Touch' })),
      ...due.map(t => ({ ...t, lead, status: 'due', source: 'cadence', label: template?.touches.find((_, i) => lead.cadence.touches[i] === t)?.label || 'Touch' }))
    ];
  }).sort((a, b) => (a.status === 'overdue' ? -1 : 1)); // Overdue first

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div className="relative rounded-2xl flex-1 overflow-hidden bg-gradient-to-r from-[hsl(var(--sidebar-background))] to-[hsl(210,50%,25%)] p-6 sm:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Agent'}! 🚀</h1>
            <p className="text-white/70 mt-1.5 text-sm sm:text-base">Here's your personal performance overview</p>
          </div>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="animate-slide-up stagger-1">
          <KPICard title="New Leads" value={filteredLeads.filter((l: any) => l.status === 'New Lead').length} icon={Users} link="/sdr/leads" />
        </div>
        <div className="animate-slide-up stagger-2">
          <KPICard title="In Progress" value={filteredLeads.filter((l: any) => l.status === 'Working').length} icon={AlertTriangle} link="/sdr/leads" />
        </div>
        <div className="animate-slide-up stagger-3">
          <KPICard title="Contacted" value={filteredLeads.filter((l: any) => l.status === 'Contacted').length} icon={Phone} link="/sdr/leads" />
        </div>
        <div className="animate-slide-up stagger-4">
          <KPICard title="Under Contract" value={filteredLeads.filter((l: any) => l.status === 'Qualified').length} icon={CheckCircle} link="/sdr/leads" />
        </div>
        <div className="animate-slide-up stagger-5">
          <KPICard title="Active Accounts" value={filteredLeads.filter((l: any) => l.status === 'Closed Won').length} icon={Target} link="/sdr/leads" />
        </div>
      </div>

      {/* Personal stats */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-slide-in-right glow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">My Performance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 auto-rows-fr">
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105 cursor-default flex flex-col items-center justify-center">
            <Users className="h-5 w-5 mb-2 text-primary animate-float" />
            <p className="text-2xl font-bold text-foreground">{leads.length}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105 cursor-default flex flex-col items-center justify-center">
            <Phone className="h-5 w-5 mb-2 text-primary animate-float" />
            <p className="text-2xl font-bold text-foreground">{agent?.callsMade ?? calls.length}</p>
            <p className="text-xs text-muted-foreground">Calls Made</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105 cursor-default flex flex-col items-center justify-center">
            <Clock className="h-5 w-5 mb-2 text-warning animate-float" />
            <p className="text-2xl font-bold text-foreground">{pendingFollowUps}</p>
            <p className="text-xs text-muted-foreground">Follow-ups Pending</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105 cursor-default flex flex-col items-center justify-center">
            <AlertTriangle className="h-5 w-5 mb-2 text-destructive animate-float" />
            <p className="text-2xl font-bold text-foreground">{overdueFollowUps}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105 cursor-default flex flex-col items-center justify-center">
            <CheckCircle className="h-5 w-5 mb-2 text-success animate-float" />
            <p className="text-2xl font-bold text-foreground">{leads.filter((l: any) => l.status === 'Closed Won').length}</p>
            <p className="text-xs text-muted-foreground">Closed Won</p>
          </div>
        </div>
      </div>


      {/* Cadence Tasks */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Cadence Actions Required</h2>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
            {allCadenceTasks.length} pending
          </span>
        </div>

        <div className="space-y-3">
          {allCadenceTasks.slice(0, 5).map((task, idx) => {
            const touchConfig = TOUCH_TYPE_CONFIG[task.type as keyof typeof TOUCH_TYPE_CONFIG] || TOUCH_TYPE_CONFIG.call;
            const Icon = touchConfig.icon === 'Phone' ? Phone : touchConfig.icon === 'Send' ? Send : Linkedin;

            return (
              <div key={`${task.lead.id}-${task.day}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors px-2 rounded-lg group">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${touchConfig.bg} ${touchConfig.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{task.label}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${task.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{task.lead.name}</span> · {task.lead.companyName}
                    </p>
                  </div>
                </div>

                <Link href={`/sdr/leads/${task.lead.id || task.lead._id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1 group-hover:border-primary group-hover:text-primary transition-colors">
                    Execute <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            );
          })}

          {allCadenceTasks.length === 0 && (
            <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-success mb-2 opacity-50" />
              <p>All cadence tasks up to date!</p>
            </div>
          )}

          {allCadenceTasks.length > 5 && (
            <div className="pt-2 text-center">
              <Link href="/sdr/leads" className="text-xs text-primary hover:underline">
                View {allCadenceTasks.length - 5} more actions
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Today's Tasks (Manual Follow-ups) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Today's Tasks</h2>
        <div className="space-y-3">
          {leads
            .filter((l: any) => l.nextFollowUp && l.status !== 'Closed Won' && l.status !== 'Closed Lost')
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
                        <button onClick={() => handleCall(lead)} className="text-xs text-primary hover:underline block text-left">{lead.phone}</button>
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
          {leads.filter((l: any) => l.nextFollowUp && l.status !== 'Closed Won' && l.status !== 'Closed Lost').length === 0 && (
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
