'use client';
import { useFunnel, useAgents, useKPIs } from '@/hooks/useApi';
import { Loader2, TrendingUp, DollarSign, Users, Award, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PIPELINE_STAGES, getStageBadgeClass } from '@/features/leads/constants/pipeline';
import DateFilter, { DateRange } from '@/components/common/DateFilter';
import { useState } from 'react';

function StatCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: any; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent || 'bg-primary/10'}`}>
          <Icon className={`h-4 w-4 ${accent ? 'text-white' : 'text-primary'}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function FunnelDashboardPage() {
  const { data: funnel, isLoading } = useFunnel();
  const { data: kpis } = useKPIs();

  const [dateRange, setDateRange] = useState<DateRange>('last7days');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stages: { stage: string; label: string; count: number; pct: number }[] = funnel?.stages || [];
  const byAgent: { name: string; total: number; closedWon: number; meetings: number }[] = funnel?.byAgent || [];
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funnel Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">End-to-end pipeline health and conversion metrics</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={funnel?.totalLeads ?? 0}
          icon={Target}
          sub="in pipeline"
        />
        <StatCard
          label="Closed Won"
          value={funnel?.closedWon ?? 0}
          sub={`${funnel?.conversionRate ?? 0}% conversion`}
          icon={TrendingUp}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Total Revenue"
          value={`$${((funnel?.totalRevenue ?? 0) / 1000).toFixed(1)}k`}
          sub="from closed deals"
          icon={DollarSign}
          accent="bg-primary"
        />
        <StatCard
          label="Avg Days (New)"
          value={funnel?.avgDaysNew ?? 0}
          sub="days since created"
          icon={Users}
        />
      </div>



      {/* Per-agent leaderboard */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Agent Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Agent</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Total</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Meetings</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Closed Won</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {byAgent.map((agent, i) => {
                const winRate = agent.total > 0 ? Math.round((agent.closedWon / agent.total) * 100) : 0;
                return (
                  <tr key={agent.name} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-amber-500 text-base">🥇</span>}
                        {i === 1 && <span className="text-slate-400 text-base">🥈</span>}
                        {i === 2 && <span className="text-orange-400 text-base">🥉</span>}
                        <span className="font-medium text-foreground">{agent.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-foreground">{agent.total}</td>
                    <td className="py-3 px-3 text-center text-foreground">{agent.meetings}</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-semibold">{agent.closedWon}</td>
                    <td className="py-3 px-3 text-center">
                      <Badge
                        className={`text-xs ${winRate >= 20 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : winRate >= 10 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-muted text-muted-foreground'}`}
                        variant="outline"
                      >
                        {winRate}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {byAgent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage conversion chain */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Stage-to-Stage Conversion</h2>
        <div className="flex flex-wrap gap-2 items-center">
          {stages.filter(s => s.count > 0).map((s, i, arr) => (
            <div key={s.stage} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStageBadgeClass(s.stage)}`}>
                  {s.label}
                </span>
                <span className="text-xs font-bold text-foreground mt-1">{s.count}</span>
              </div>
              {i < arr.length - 1 && (
                <span className="text-muted-foreground text-sm font-medium">
                  → {arr[i + 1].count > 0 ? Math.round((arr[i + 1].count / s.count) * 100) : 0}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
