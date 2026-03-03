'use client';
import { Users, Phone, AlertTriangle, Clock, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import KPICard from '@/components/common/KPICard';
import LeadTable from '@/components/common/LeadTable';
import { useLeads } from '@/hooks/useApi';
import { useMyTasks } from '@/features/activities/hooks/useActivities';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/AuthContext';
import DateFilter, { DateRange, filterByDateRange } from '@/components/common/DateFilter';
import { useState } from 'react';
import { ActiveAccountsListModal } from '../../leads/components/ActiveAccountsListModal';
import { format } from 'date-fns';

export default function SDRDashboard() {
  const { user } = useAuth();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: tasks = [], isLoading: tasksLoading } = useMyTasks();

  const [dateRange, setDateRange] = useState<DateRange>('last7days');
  const [isActiveAccountsModalOpen, setIsActiveAccountsModalOpen] = useState(false);

  const filteredLeads = filterByDateRange(leads, dateRange);

  const today = new Date();

  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < today);

  const newLeadsCount = filteredLeads.filter((l: any) => l.pipelineStage?.name === 'New' || l.status === 'New Lead').length;
  const contactedLeadsCount = filteredLeads.filter((l: any) => l.pipelineStage?.name === 'Contacted').length;
  const wonLeadsCount = filteredLeads.filter((l: any) => l.pipelineStage?.name === 'Won' || l.status === 'Closed Won').length;

  if (leadsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your personal performance overview</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-slide-up stagger-1">
          <KPICard title="New Leads" value={newLeadsCount} icon={Users} link="/sdr/leads" />
        </div>
        <div className="animate-slide-up stagger-2">
          <KPICard title="Contacted" value={contactedLeadsCount} icon={Phone} link="/sdr/leads" />
        </div>
        <div className="animate-slide-up stagger-3">
          <KPICard title="Pending Tasks" value={pendingTasks.length} icon={AlertTriangle} link="/sdr/leads" />
        </div>
        <div className="animate-slide-up stagger-4">
          <KPICard title="Active Accounts" value={wonLeadsCount} icon={CheckCircle} onClick={() => setIsActiveAccountsModalOpen(true)} />
        </div>
      </div>

      {/* Today's Tasks (Manual Follow-ups) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">My Pending Tasks</h2>
          <span className="text-sm text-muted-foreground">{pendingTasks.length} to do</span>
        </div>
        <div className="space-y-3">
          {pendingTasks
            .sort((a: any, b: any) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
            .slice(0, 10)
            .map((task: any) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < today;
              return (
                <div key={task._id} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-secondary/20 px-2 rounded transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${isOverdue ? 'bg-destructive' : 'bg-warning'}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{task.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.leadId?.firstName} {task.leadId?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      {task.dueDate && (
                        <p className={`text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {isOverdue ? 'Overdue' : 'Due'}: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </p>
                      )}
                      <p className="text-xs uppercase text-muted-foreground">{task.type}</p>
                    </div>
                    {task.leadId && (
                      <Link href={`/sdr/leads/${task.leadId._id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 group-hover:border-primary group-hover:text-primary transition-colors">
                          Execute <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          {pendingTasks.length === 0 && (
            <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-success mb-2 opacity-50" />
              <p>All tasks up to date! Great job.</p>
            </div>
          )}
        </div>
      </div>

      {/* My Leads Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">My Recent Leads</h2>
          <span className="text-sm text-muted-foreground">{leads.length} total</span>
        </div>
        <LeadTable leads={leads.slice(0, 10)} />
      </div>

      <ActiveAccountsListModal
        isOpen={isActiveAccountsModalOpen}
        onClose={() => setIsActiveAccountsModalOpen(false)}
        leads={filteredLeads}
      />
    </div>
  );
}
