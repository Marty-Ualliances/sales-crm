import { useMemo } from 'react';
import { Mail, Send, Users, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/hooks/useApi';

export default function LeadGenEmail() {
  const { data: leads = [], isLoading } = useLeads();

  // Leads that have an email address
  const leadsWithEmail = useMemo(() => leads.filter((l: any) => l.email), [leads]);

  // Contacted leads = leads where status is not 'New' (proxy for "emailed/reached")
  const contactedLeads = useMemo(() => leadsWithEmail.filter((l: any) => l.status !== 'New'), [leadsWithEmail]);

  // Today's date for filtering "today"
  const today = new Date().toDateString();
  const recentlyActive = useMemo(() =>
    leadsWithEmail.filter((l: any) => new Date(l.lastActivity).toDateString() === today),
    [leadsWithEmail, today]
  );

  const stats = [
    { label: 'Leads with Email', value: leadsWithEmail.length, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Reached via Email', value: contactedLeads.length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Active Today', value: recentlyActive.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
    { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Outreach</h1>
        <p className="text-sm text-muted-foreground mt-1">Track email engagement across your leads</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : stat.value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Lead email list */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Leads with Email Addresses</h2>
          <Badge variant="secondary">{leadsWithEmail.length} leads</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Assigned SDR</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : leadsWithEmail.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No leads with email addresses yet.</td></tr>
              ) : (
                leadsWithEmail.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.companyName || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={lead.status === 'Closed' ? 'default' : lead.status === 'New' ? 'secondary' : 'outline'}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{lead.assignedAgent || 'Unassigned'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk email note */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 shrink-0">
            <Send className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Bulk Email Integration</h3>
            <p className="text-sm text-muted-foreground">
              Bulk email sending requires integration with an email service (e.g. SendGrid, Mailchimp).
              Contact your admin to configure an email provider and unlock bulk sending features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
