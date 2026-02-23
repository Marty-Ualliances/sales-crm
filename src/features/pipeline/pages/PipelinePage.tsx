import { useLeads } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { PIPELINE_STAGES, getStageColor } from '@/features/leads/constants/pipeline';

export default function PipelinePage() {
  const { data: leads = [], isLoading } = useLeads();

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
        <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Kanban view of your lead funnel</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const colLeads = leads.filter((l: any) => l.status === stage.key);
          return (
            <div key={stage.key} className="min-w-[220px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">{colLeads.length}</Badge>
              </div>
              <div className="space-y-2.5">
                {colLeads.map((lead: any) => (
                  <div key={lead.id} className="rounded-lg border border-border bg-card p-3.5 shadow-card hover:shadow-card-hover transition-shadow">
                    <p className="font-medium text-foreground text-sm">{lead.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lead.companyName || lead.phone}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{lead.assignedAgent}</span>
                      {lead.callCount > 0 && (
                        <span className="text-xs text-muted-foreground">{lead.callCount} calls</span>
                      )}
                    </div>
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-xs text-muted-foreground">No leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
