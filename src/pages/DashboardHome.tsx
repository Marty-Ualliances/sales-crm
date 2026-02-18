import { Users, Phone, AlertTriangle, CalendarCheck, Loader2 } from 'lucide-react';
import KPICard from '@/components/KPICard';
import LeadTable from '@/components/LeadTable';
import RecentActivityFeed from '@/components/RecentActivityFeed';
import { useLeads, useKPIs } from '@/hooks/useApi';
export default function DashboardHome() {
  const { data: kpis, isLoading: kpisLoading } = useKPIs();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();

  if (kpisLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, Sarah. Here's your overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={kpis?.totalLeads ?? 0} icon={Users} change="+12%" link="/dashboard/leads" />
        <KPICard title="Total Calls" value={kpis?.totalCalls ?? 0} icon={Phone} change="+8%" link="/dashboard/calls" />
        <KPICard 
          title="Follow-ups Due" 
          value={kpis?.followUpsRemaining ?? 0} 
          icon={AlertTriangle} 
          variant={(kpis?.overdueFollowUps ?? 0) > 0 ? 'danger' : 'default'}
          subtitle={`${kpis?.overdueFollowUps ?? 0} overdue`}
          link="/dashboard/follow-ups"
        />
        <KPICard title="Appointments" value={kpis?.appointmentsBooked ?? 0} icon={CalendarCheck} change="+3" variant="success" link="/dashboard/calendar" />
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed />

      {/* Lead Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Lead Overview</h2>
          <span className="text-sm text-muted-foreground">{leads.length} leads</span>
        </div>
        <LeadTable leads={leads} />
      </div>
    </div>
  );
}
