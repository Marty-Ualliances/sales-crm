import { useLeads } from '@/hooks/useApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import LeadTable from '@/components/common/LeadTable';
import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadStatus } from '@/features/leads/types/leads';
import { STAGE_KEYS, PRIORITY_KEYS } from '@/features/leads/constants/pipeline';


export default function MyLeadsPage() {
  const { user } = useAuth();
  const { data: allLeads = [], isLoading } = useLeads();
  const leads = allLeads.filter((l: any) => !l.assignedAgent || l.assignedAgent === user?.name);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'A' | 'B' | 'C' | 'all'>('all');

  const filtered = leads.filter((l: any) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || l.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

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
        <h1 className="text-2xl font-bold text-foreground">My Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">{leads.length} leads assigned to you</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
          {STAGE_KEYS.map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s as LeadStatus)}>{s}</Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground font-medium">Priority:</span>
          <Button variant={priorityFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setPriorityFilter('all')}>All</Button>
          {PRIORITY_KEYS.map(p => (
            <Button key={p} variant={priorityFilter === p ? 'default' : 'outline'} size="sm" onClick={() => setPriorityFilter(p)}>{p}</Button>
          ))}
        </div>
      </div>

      <LeadTable leads={filtered} />
    </div>
  );
}
