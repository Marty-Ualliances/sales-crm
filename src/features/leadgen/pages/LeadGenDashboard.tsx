import { Link } from 'react-router-dom';
import { Users, FileSpreadsheet, UserCheck, UserX, TrendingUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KPICard from '@/components/common/KPICard';
import { useLeads, useAgents } from '@/hooks/useApi';
import DateFilter, { DateRange, filterByDateRange } from '@/components/common/DateFilter';
import { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function LeadGenDashboard() {
  const { user } = useAuth();
  const { data: allLeads = [], isLoading } = useLeads();
  const { data: agents = [] } = useAgents();

  const [dateRange, setDateRange] = useState<DateRange>('last7days');
  const leads = user?.role === 'admin' ? allLeads : allLeads.filter((l: any) => l.addedBy === user?.name);
  const filteredLeads = filterByDateRange(leads, dateRange);

  const sdrs = agents.filter((a: any) => a.role === 'sdr');
  const totalLeads = leads.length;
  const assignedLeads = leads.filter((l: any) => l.assignedAgent && l.assignedAgent !== 'Unassigned').length;
  const unassignedLeads = totalLeads - assignedLeads;
  const newLeads = leads.filter((l: any) => l.status === 'New Lead').length;

  const stats = [
    { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Assigned', value: assignedLeads, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Unassigned', value: unassignedLeads, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
    { label: 'Active SDRs', value: sdrs.length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  ];

  // Leads per SDR breakdown
  const sdrBreakdown = sdrs.map((sdr: any) => ({
    name: sdr.name,
    avatar: sdr.avatar,
    count: leads.filter((l: any) => l.assignedAgent === sdr.name).length,
  })).sort((a: any, b: any) => b.count - a.count);

  // Recent leads (last 5)
  const recentLeads = [...leads]
    .sort((a: any, b: any) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Gen Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your lead pipeline</p>
        </div>
        <div className="flex gap-2 items-center">
          <DateFilter value={dateRange} onChange={setDateRange} />
          <Button asChild variant="outline">
            <Link to="/leadgen/leads">
              <Users className="h-4 w-4 mr-2" />
              All Leads
            </Link>
          </Button>
          <Button asChild className="gradient-primary border-0">
            <Link to="/leadgen/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="animate-slide-up stagger-1">
          <KPICard title="New Leads" value={filteredLeads.filter((l: any) => l.status === 'New Lead').length} icon={Users} link="/leadgen/leads" />
        </div>
        <div className="animate-slide-up stagger-2">
          <KPICard title="In Progress" value={filteredLeads.filter((l: any) => l.status === 'Working').length} icon={TrendingUp} link="/leadgen/leads" />
        </div>
        <div className="animate-slide-up stagger-3">
          <KPICard title="Contacted" value={filteredLeads.filter((l: any) => l.status === 'Contacted').length} icon={UserCheck} link="/leadgen/leads" />
        </div>
        <div className="animate-slide-up stagger-4">
          <KPICard title="Under Contract" value={filteredLeads.filter((l: any) => l.status === 'Qualified').length} icon={UserCheck} link="/leadgen/leads" />
        </div>
        <div className="animate-slide-up stagger-5">
          <KPICard title="Active Accounts" value={filteredLeads.filter((l: any) => l.status === 'Closed Won').length} icon={UserCheck} link="/leadgen/leads" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads per SDR */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-base font-semibold text-foreground mb-4">Leads per SDR</h2>
          {sdrBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No SDRs found.</p>
          ) : (
            <div className="space-y-3">
              {sdrBreakdown.map((sdr: any) => (
                <div key={sdr.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    {sdr.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{sdr.name}</span>
                      <span className="text-sm text-muted-foreground">{sdr.count} leads</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all"
                        style={{ width: totalLeads > 0 ? `${Math.round((sdr.count / totalLeads) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Leads</h2>
            <Link to="/leadgen/leads" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet. Upload a CSV to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.companyName || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${lead.status === 'New Lead' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'Working' ? 'bg-yellow-100 text-yellow-700' :
                        lead.status === 'Closed Won' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>{lead.status}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{lead.assignedAgent || 'Unassigned'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-base font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="gradient-primary border-0">
            <Link to="/leadgen/upload"><FileSpreadsheet className="h-4 w-4 mr-2" />Import CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leadgen/leads"><Users className="h-4 w-4 mr-2" />Manage Leads</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leadgen/linkedin"><Users className="h-4 w-4 mr-2" />LinkedIn List</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leadgen/email"><Users className="h-4 w-4 mr-2" />Email Outreach</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
