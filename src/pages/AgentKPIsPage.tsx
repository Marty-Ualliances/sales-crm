'use client';

import { useAgents } from '@/hooks/useApi';
import { BarChart3, Phone, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AgentKPIsPage() {
  const { data: agents = [], isLoading } = useAgents();

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
        <h1 className="text-2xl font-bold text-foreground">Agent Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">Compare KPIs across your team</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 auto-rows-fr">
        {agents.map((agent: any) => (
          <div key={agent.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {agent.avatar}
              </div>
              <div>
                <p className="font-semibold text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground">{agent.email}</p>
              </div>
              <Badge variant={agent.role === 'admin' ? 'default' : 'secondary'} className="ml-auto text-xs">
                {agent.role}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              {[
                { icon: BarChart3, label: 'Leads', value: agent.leadsAssigned },
                { icon: Phone, label: 'Calls', value: agent.callsMade },
                { icon: CheckCircle, label: 'Completed', value: agent.followUpsCompleted },
                { icon: Clock, label: 'Pending', value: agent.followUpsPending, danger: agent.followUpsPending > 10 },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <kpi.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${kpi.danger ? 'text-destructive' : 'text-primary'}`} />
                  <p className={`text-lg font-bold ${kpi.danger ? 'text-destructive' : 'text-foreground'}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
