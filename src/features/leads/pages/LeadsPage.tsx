import { useLeads, useAgents } from '@/hooks/useApi';
import LeadTable from '@/components/common/LeadTable';
import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadStatus } from '@/features/leads/types/leads';
import { STAGE_KEYS, PRIORITY_KEYS } from '@/features/leads/constants/pipeline';

const PAGE_SIZE = 25;

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const { data: agents = [] } = useAgents();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'A' | 'B' | 'C' | 'all'>('all');
  const [userFilter, setUserFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = leads.filter((l: any) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || l.priority === priorityFilter;
    const matchUser = userFilter === 'all' || l.assignedAgent === userFilter || l.addedBy === userFilter;
    return matchSearch && matchStatus && matchPriority && matchUser;
  });

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0) + (userFilter !== 'all' ? 1 : 0);

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
        <h1 className="text-2xl font-bold text-foreground">All Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {leads.length} leads</p>
      </div>

      {/* Search + Filter Button */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 px-4"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-elevated z-50 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Filters</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setUserFilter('all'); }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* User */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Team Member</label>
                  <select
                    value={userFilter}
                    onChange={e => setUserFilter(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="all">All Users</option>
                    {agents.map((agent: any) => (
                      <option key={agent.id} value={agent.name}>{agent.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as LeadStatus | 'all')}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="all">All Statuses</option>
                    {STAGE_KEYS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Priority</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPriorityFilter('all')}
                      className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${priorityFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-input bg-background text-foreground hover:bg-secondary'}`}
                    >
                      All
                    </button>
                    {PRIORITY_KEYS.map(p => (
                      <button
                        key={p}
                        onClick={() => setPriorityFilter(p)}
                        className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${priorityFilter === p ? 'bg-primary text-primary-foreground border-primary' : 'border-input bg-background text-foreground hover:bg-secondary'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter('all')} className="hover:text-primary/70 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {priorityFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Priority: {priorityFilter}
              <button onClick={() => setPriorityFilter('all')} className="hover:text-primary/70 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {userFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              User: {userFilter}
              <button onClick={() => setUserFilter('all')} className="hover:text-primary/70 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      <LeadTable leads={paginated} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm font-medium text-foreground px-2">
              {safePage} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

