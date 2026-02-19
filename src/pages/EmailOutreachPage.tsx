import { useMemo, useState } from 'react';
import { Mail, Users, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/hooks/useApi';

export default function EmailOutreachPage() {
    const { data: leads = [], isLoading } = useLeads();
    const [search, setSearch] = useState('');

    const leadsWithEmail = useMemo(() =>
        leads.filter((l: any) => l.email).filter((l: any) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.companyName?.toLowerCase().includes(q);
        }),
        [leads, search]
    );

    const contactedLeads = useMemo(() => leadsWithEmail.filter((l: any) => l.status !== 'New'), [leadsWithEmail]);
    const today = new Date().toDateString();
    const activeToday = useMemo(() =>
        leadsWithEmail.filter((l: any) => new Date(l.lastActivity).toDateString() === today),
        [leadsWithEmail, today]
    );

    const stats = [
        { label: 'Leads with Email', value: leadsWithEmail.length, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
        { label: 'Reached via Email', value: contactedLeads.length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
        { label: 'Active Today', value: activeToday.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
        { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Email Outreach</h1>
                <p className="text-sm text-muted-foreground mt-1">Track email engagement across leads</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(stat => (
                    <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
                        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} mb-3`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{isLoading ? '...' : stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by name, email, or company..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
            </div>

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
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No leads with email addresses found.</td></tr>
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
        </div>
    );
}
