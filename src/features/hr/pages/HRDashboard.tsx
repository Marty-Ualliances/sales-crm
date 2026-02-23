import { Users, PhoneCall, CheckCircle2, XCircle, TrendingUp, Loader2, BarChart3, UserPlus } from 'lucide-react';
import KPICard from '@/components/common/KPICard';
import { useHRDashboard } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';


export default function HRDashboard() {
  const { data, isLoading } = useHRDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-foreground shimmer-text">HR Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Track agent performance, lead attribution, and closings</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="animate-slide-up stagger-1">
          <KPICard title="New Leads" value={data?.agentPerformance?.reduce((acc: number, curr: any) => acc + (curr.leadsAdded || 0), 0) ?? 0} icon={Users} link="/hr/leads" />
        </div>
        <div className="animate-slide-up stagger-2">
          <KPICard title="In Progress" value={data?.activeLeads ?? 0} icon={UserPlus} link="/hr/leads" />
        </div>
        <div className="animate-slide-up stagger-3">
          <KPICard title="Contacted" value={data?.totalCalls ?? 0} icon={PhoneCall} link="/hr/leads" />
        </div>
        <div className="animate-slide-up stagger-4">
          <KPICard title="Under Contract" value={0} icon={CheckCircle2} link="/hr/leads" />
        </div>
        <div className="animate-slide-up stagger-5">
          <KPICard title="Active Accounts" value={data?.closedLeads ?? 0} icon={BarChart3} link="/hr/closed-leads" />
        </div>
      </div>

      {/* Agent Performance Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Agent Performance</h2>
          <button
            onClick={() => navigate('/hr/leads')}
            className="text-sm text-primary hover:underline font-medium"
          >
            View all leads →
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
          {(data?.agentPerformance || []).map((agent: any, idx: number) => (
            <div
              key={agent.id}
              className="rounded-xl border border-border bg-card p-4 shadow-card hover:-translate-y-1 hover:shadow-[0_0_20px_4px_hsl(var(--primary)/0.12)] transition-all duration-300 animate-slide-up flex flex-col"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {agent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{agent.name}</p>
                  <Badge variant="secondary" className="text-xs">SDR</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mt-auto">
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="text-lg font-bold text-foreground">{agent.leadsAdded}</p>
                  <p className="text-xs text-muted-foreground">Added</p>
                </div>
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="text-lg font-bold text-foreground">{agent.callsMade}</p>
                  <p className="text-xs text-muted-foreground">Calls</p>
                </div>
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="text-lg font-bold text-foreground">{agent.leadsAssigned}</p>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </div>
                <div className="rounded-md bg-emerald-500/10 p-2">
                  <p className="text-lg font-bold text-emerald-600">{agent.leadsClosed}</p>
                  <p className="text-xs text-muted-foreground">Closed</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Detailed Performance Table */}
      <div className="rounded-xl border border-border bg-card shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Detailed Breakdown</h2>
        </div>
        {(data?.agentPerformance || []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-semibold text-muted-foreground">Agent</th>
                  <th className="pb-3 font-semibold text-muted-foreground text-center">
                    <div className="flex items-center justify-center gap-1"><UserPlus className="h-3.5 w-3.5" />Added</div>
                  </th>
                  <th className="pb-3 font-semibold text-muted-foreground text-center">Assigned</th>
                  <th className="pb-3 font-semibold text-muted-foreground text-center">
                    <div className="flex items-center justify-center gap-1"><PhoneCall className="h-3.5 w-3.5" />Calls</div>
                  </th>
                  <th className="pb-3 font-semibold text-muted-foreground text-center">
                    <div className="flex items-center justify-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Closed</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.agentPerformance.map((agent: any, idx: number) => (
                  <tr
                    key={agent.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors animate-slide-up"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                          {agent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {agent.leadsAdded}
                      </span>
                    </td>
                    <td className="py-3 text-center">{agent.leadsAssigned}</td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        {agent.callsMade}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        {agent.leadsClosed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No agent data available</p>
        )}
      </div>
    </div>
  );
}
