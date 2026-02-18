import { AlertTriangle, CalendarCheck, UserPlus, Loader2 } from 'lucide-react';
import KPICard from '@/components/KPICard';
import RecentActivityFeed from '@/components/RecentActivityFeed';
import { useLeads, useAgents, useKPIs } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: kpis, isLoading: kpisLoading } = useKPIs();
  const navigate = useNavigate();

  // Calculate new leads (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newLeadsCount = leads.filter((l: any) => new Date(l.date) >= sevenDaysAgo).length;

  // Generate chart data for leads over the last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = leads.filter((l: any) => l.date === dateStr).length;
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      leads: count,
    };
  });

  if (kpisLoading || agentsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-foreground shimmer-text">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete overview of your team's performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="animate-slide-up stagger-1">
          <KPICard title="New Leads (7d)" value={newLeadsCount} icon={UserPlus} variant="success" link="/admin/leads" />
        </div>
        <div className="animate-slide-up stagger-2">
          <KPICard
            title="Follow-ups Due"
            value={kpis?.followUpsRemaining ?? 0}
            icon={AlertTriangle}
            variant={(kpis?.overdueFollowUps ?? 0) > 0 ? 'danger' : 'default'}
            subtitle={`${kpis?.overdueFollowUps ?? 0} overdue`}
            link="/admin/follow-ups"
          />
        </div>
      </div>

      {/* Team Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Team Overview</h2>
          <button
            onClick={() => navigate('/admin/team')}
            className="text-sm text-primary hover:underline font-medium"
          >
            Manage Team →
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
          {agents.map((agent: any, idx: number) => (
            <div
              key={agent.id}
              className="rounded-xl border border-border bg-card p-4 shadow-card hover:-translate-y-1 hover:shadow-[0_0_20px_4px_hsl(var(--primary)/0.12)] transition-all duration-300 animate-slide-up flex flex-col"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {agent.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{agent.name}</p>
                  <Badge variant={agent.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                    {agent.role}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mt-auto">
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="text-lg font-bold text-foreground">{agent.leadsAssigned}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="text-lg font-bold text-foreground">{agent.callsMade || 0}</p>
                  <p className="text-xs text-muted-foreground">Calls</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed />

      {/* Leads Generation Graph */}
      <div className="rounded-xl border border-border bg-card shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Leads Generation</h2>
            <p className="text-sm text-muted-foreground">Daily lead creation over the last 7 days</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLeads)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
