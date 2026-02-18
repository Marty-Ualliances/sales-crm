import { useLeads } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { LeadStatus } from '@/types/leads';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const columns: { status: LeadStatus; color: string }[] = [
  { status: 'New', color: 'bg-primary' },
  { status: 'Contacted', color: 'bg-warning' },
  { status: 'Follow-up', color: 'bg-accent-foreground' },
  { status: 'Closed', color: 'bg-success' },
  { status: 'Lost', color: 'bg-muted-foreground' },
];

export default function SDRPipelinePage() {
  const { user } = useAuth();
  const { data: allLeads = [], isLoading } = useLeads();
  const leads = allLeads.filter((l: any) => !l.assignedAgent || l.assignedAgent === user?.name);

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
        <h1 className="text-2xl font-bold text-foreground">My Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Your personal lead funnel</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colLeads = leads.filter((l: any) => l.status === col.status);
          return (
            <div key={col.status} className="min-w-[260px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                <span className="text-sm font-semibold text-foreground">{col.status}</span>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">{colLeads.length}</Badge>
              </div>
              <div className="space-y-2.5">
                {colLeads.map((lead: any) => (
                  <div key={lead.id} className="rounded-lg border border-border bg-card p-3.5 shadow-card hover:shadow-card-hover transition-shadow">
                    <p className="font-medium text-foreground text-sm">{lead.name}</p>
                    {lead.phone ? (
                      <a href={`tel:${lead.phone.replace(/[^+\d]/g, '')}`} className="text-xs text-primary hover:underline mt-1 block">{lead.phone}</a>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">No phone</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{lead.email}</span>
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
