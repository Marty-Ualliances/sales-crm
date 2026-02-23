import { AlertTriangle, CalendarCheck, UserPlus, Loader2, BarChart2, Coffee, Phone, CheckCircle } from 'lucide-react';
import KPICard from '@/components/common/KPICard';
import RecentActivityFeed from '@/components/common/RecentActivityFeed';
import { useLeads, useAgents, useKPIs, useFunnel, useCalls } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PIPELINE_STAGES, getStageBadgeClass } from '@/features/leads/constants/pipeline';
import DateFilter, { DateRange, filterByDateRange } from '@/components/common/DateFilter';

export default function AdminDashboard() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: kpis, isLoading: kpisLoading } = useKPIs();
  const { data: funnel } = useFunnel();
  const { data: allCalls = [] } = useCalls();
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('last7days');

  // Filter leads for KPI cards
  const filteredLeads = filterByDateRange(leads, dateRange);

  // Calculate new leads (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newLeadsCount = leads.filter((l: any) => new Date(l.date) >= sevenDaysAgo).length;

  // Filter leads and calls by selected user
  const chartLeads = selectedUser === 'all' ? leads : leads.filter((l: any) => l.assignedAgent === selectedUser);
  const chartCalls = selectedUser === 'all' ? allCalls : allCalls.filter((c: any) => c.agent === selectedUser);

  // Generate chart data for leads + calls over the last 14 days
  const chartData = Array.from({ length: 14 }).map((_, i) => {
    const date = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const leadCount = chartLeads.filter((l: any) => {
      const ld = new Date(l.date).toISOString().split('T')[0];
      return ld === dateStr;
    }).length;
    const callCount = chartCalls.filter((c: any) => {
      const cd = new Date(c.date).toISOString().split('T')[0];
      return cd === dateStr;
    }).length;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day: dayName,
      fullDate,
      leads: leadCount,
      calls: callCount,
      total: leadCount + callCount,
    };
  });

  // Custom tooltip for the bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl p-4 min-w-[180px]">
        <p className="text-sm font-semibold text-foreground mb-2">{data?.fullDate}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Leads</span>
            </div>
            <span className="text-sm font-bold text-foreground">{data?.leads}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Calls</span>
            </div>
            <span className="text-sm font-bold text-foreground">{data?.calls}</span>
          </div>
          <div className="border-t border-border/50 pt-1.5 mt-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Activity</span>
              <span className="text-sm font-bold text-primary">{data?.total}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (kpisLoading || agentsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of all team activity</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="animate-slide-up stagger-1">
          <KPICard title="New Leads" value={filteredLeads.filter((l: any) => l.status === 'New Lead').length} icon={UserPlus} link="/admin/leads" />
        </div>
        <div className="animate-slide-up stagger-2">
          <KPICard title="In Progress" value={filteredLeads.filter((l: any) => l.status === 'Working').length} icon={AlertTriangle} link="/admin/leads" />
        </div>
        <div className="animate-slide-up stagger-3">
          <KPICard title="Contacted" value={filteredLeads.filter((l: any) => l.status === 'Contacted').length} icon={Phone} link="/admin/leads" />
        </div>
        <div className="animate-slide-up stagger-4">
          <KPICard title="Under Contract" value={filteredLeads.filter((l: any) => l.status === 'Qualified').length} icon={CheckCircle} link="/admin/leads" />
        </div>
        <div className="animate-slide-up stagger-5">
          <KPICard title="Active Accounts" value={filteredLeads.filter((l: any) => l.status === 'Closed Won').length} icon={BarChart2} link="/admin/leads" />
        </div>
      </div>

      {/* Quick launch row */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/admin/huddle')}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:border-primary/30 hover:shadow-[0_4px_20px_hsl(var(--primary)/0.1)] transition-all duration-300 shadow-card group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
            <Coffee className="h-4 w-4 text-amber-500" />
          </div>
          Daily Huddle
        </button>
        <button
          onClick={() => navigate('/admin/funnel')}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:border-primary/30 hover:shadow-[0_4px_20px_hsl(var(--primary)/0.1)] transition-all duration-300 shadow-card group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          Funnel KPIs
        </button>
      </div>

      {/* Funnel snapshot */}
      {funnel?.stages && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Pipeline Snapshot</h2>
            <button onClick={() => navigate('/admin/funnel')} className="text-xs text-primary hover:underline font-medium">
              Full Funnel →
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {(funnel.stages as any[]).filter((s: any) => s.count > 0).slice(0, 6).map((s: any) => (
              <div key={s.stage} className="flex flex-col items-center gap-1.5 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/20 p-3 text-center hover:from-secondary/70 hover:to-secondary/30 transition-all duration-200">
                <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium ${getStageBadgeClass(s.stage)}`}>
                  {s.label}
                </span>
                <span className="text-2xl font-bold text-foreground tracking-tight">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
          {agents.map((agent: any, idx: number) => {
            const addedLeads = leads.filter((l: any) => l.addedBy === agent.name);
            const convertedLeads = addedLeads.filter((l: any) => l.status === 'Closed Won');
            const sdrMeetings = leads.filter((l: any) => l.assignedAgent === agent.name && (l.status === 'Meeting Booked' || l.status === 'Meeting Completed'));

            return (
              <div
                key={agent.id}
                className="rounded-xl border border-border bg-card p-4 shadow-card hover:-translate-y-1 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.1)] transition-all duration-300 animate-slide-up flex flex-col group"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-medium ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    {agent.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{agent.name}</p>
                    <Badge variant={agent.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {agent.role}
                    </Badge>
                  </div>
                </div>
                <div className={`grid ${agent.role === 'sdr' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center mt-auto`}>
                  {agent.role === 'leadgen' ? (
                    <>
                      <div className="rounded-md bg-secondary/50 p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{addedLeads.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Leads Added</p>
                      </div>
                      <div className="rounded-md bg-secondary/50 p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{convertedLeads.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Converted</p>
                      </div>
                    </>
                  ) : agent.role === 'sdr' ? (
                    <>
                      <div className="rounded-md bg-secondary/50 p-2 flex flex-col items-center justify-center">
                        <p className="text-base font-bold text-foreground leading-none mb-1">{agent.callsMade || 0}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Calls</p>
                      </div>
                      <div className="rounded-md bg-secondary/50 p-2 flex flex-col items-center justify-center">
                        <p className="text-base font-bold text-foreground leading-none mb-1">{sdrMeetings.length}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Meetings</p>
                      </div>
                      <div className="rounded-md bg-secondary/50 p-2 flex flex-col items-center justify-center">
                        <p className="text-base font-bold text-foreground leading-none mb-1">{agent.followUpsCompleted || 0}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Follow-ups</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-md bg-secondary/50 p-2">
                        <p className="text-lg font-bold text-foreground">{agent.leadsAssigned}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Leads</p>
                      </div>
                      <div className="rounded-md bg-secondary/50 p-2">
                        <p className="text-lg font-bold text-foreground">{agent.callsMade || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Calls</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed />

      {/* Daily Activity Bar Chart */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-border/50 bg-gradient-to-r from-card to-secondary/20">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Daily Activity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Leads created &amp; calls made — last 14 days</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground w-[160px]"
            >
              <option value="all">All Team Members</option>
              {agents.map((agent: any) => (
                <option key={agent.id} value={agent.name}>{agent.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Leads</span>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Calls</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barGap={2} barCategoryGap="20%">
              <defs>
                <linearGradient id="barLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="barCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.06, radius: 6 }} />
              <Bar
                dataKey="leads"
                fill="url(#barLeads)"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="calls"
                fill="url(#barCalls)"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={200}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
