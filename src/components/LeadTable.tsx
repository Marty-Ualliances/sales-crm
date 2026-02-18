import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Lead, LeadStatus } from '@/types/leads';
import { useCompleteFollowUp } from '@/hooks/useApi';
import { toast } from 'sonner';

const statusColors: Record<LeadStatus, string> = {
  'New': 'bg-primary/10 text-primary border-primary/20',
  'Contacted': 'bg-warning/10 text-warning border-warning/20',
  'Follow-up': 'bg-accent text-accent-foreground border-accent-foreground/20',
  'Closed': 'bg-success/10 text-success border-success/20',
  'Lost': 'bg-muted text-muted-foreground border-border',
};

/** Strips a phone string down to digits (preserving leading +) for tel: URI */
function toTelUri(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

export default function LeadTable({ leads, compact = false }: { leads: Lead[]; compact?: boolean }) {
  const today = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();
  const completeFollowUp = useCompleteFollowUp();

  const handleComplete = async (lead: Lead) => {
    if (lead.nextFollowUp) {
      try {
        await completeFollowUp.mutateAsync(lead.id);
        toast.success(`Follow-up with ${lead.name} completed`);
      } catch {
        toast.error('Failed to complete follow-up');
      }
    }
  };

  const location = useLocation();
  const basePath = location.pathname.startsWith('/sdr') ? '/sdr' : '/admin';

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Company</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Agent</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Location</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Source</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Follow-up</th>
              {!compact && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, idx) => {
              const isOverdue = lead.nextFollowUp && lead.nextFollowUp < today && lead.status !== 'Closed' && lead.status !== 'Lost';
              return (
                <tr
                  key={lead.id}
                  className={`border-b border-border/50 hover:bg-secondary/30 transition-all duration-200 animate-slide-up ${isOverdue ? 'bg-destructive/5' : ''}`}
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                >
                  <td className="px-4 py-3">
                    <div>
                      <Link to={`${basePath}/leads/${lead.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {lead.name}
                      </Link>
                      {lead.title && <p className="text-xs text-muted-foreground">{lead.title}</p>}
                      {lead.phone && (
                        <a href={toTelUri(lead.phone)} className="text-xs text-primary hover:underline md:hidden">{lead.phone}</a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    <div>
                      <p className="text-sm">{lead.companyName || '—'}</p>
                      {lead.employees && <p className="text-xs text-muted-foreground">{lead.employees} employees</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {lead.phone ? (
                      <a href={toTelUri(lead.phone)} className="text-sm text-primary hover:underline">{lead.phone}</a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{lead.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.assignedAgent}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {lead.city || lead.state ? `${lead.city || ''}${lead.city && lead.state ? ', ' : ''}${lead.state || ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {lead.source ? (
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {lead.source}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {lead.nextFollowUp ? (
                      <span className={`text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                        {isOverdue && '⚠ '}{lead.nextFollowUp}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  {!compact && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lead.phone && (
                          <a href={toTelUri(lead.phone)} title="Call Now">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                          title="View Details" onClick={() => navigate(`${basePath}/leads/${lead.id}`)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10"
                          title="Complete Follow-up" onClick={() => handleComplete(lead)}
                          disabled={!lead.nextFollowUp}>
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
