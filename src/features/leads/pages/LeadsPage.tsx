'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeads, useAgents } from '@/hooks/useApi';
import LeadTable from '@/components/common/LeadTable';

const PAGE_SIZE = 25;

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const STATUS_OPTIONS = ['New Lead', 'In Progress', 'Contacted', 'Appointment Set', 'Active Account'] as const;

const SORT_OPTIONS = [
  { value: 'size-asc', label: 'Company Size: Small → Large' },
  { value: 'size-desc', label: 'Company Size: Large → Small' },
  { value: 'new-old', label: 'New → Old (Date Added)' },
  { value: 'old-new', label: 'Old → New (Date Added)' },
  { value: 'recent-updates', label: 'Recent Updates (Last Activity)' },
] as const;

type CompanySizeRange = 'all' | '1-10' | '11-50' | '51-200' | '201-500' | '500+';
type SortOption = typeof SORT_OPTIONS[number]['value'];

const matchesStatus = (rawStatus?: string, filter?: string) => {
  if (!filter || filter === 'all') {
    return true;
  }
  if (!rawStatus) {
    return false;
  }

  const status = rawStatus.trim().toLowerCase();
  const normalizedFilter = filter.toLowerCase();

  if (normalizedFilter === 'in progress') {
    return status === 'in progress' || status === 'working';
  }
  if (normalizedFilter === 'contacted') {
    return status === 'contacted' || status === 'connected';
  }
  if (normalizedFilter === 'appointment set') {
    return status === 'appointment set' || status === 'meeting booked';
  }
  if (normalizedFilter === 'active account') {
    return status === 'active account' || status === 'closed won' || status === 'active account (closed won)';
  }

  return status === normalizedFilter;
};

const inCompanySizeRange = (employeeCount: number | null | undefined, range: CompanySizeRange) => {
  if (range === 'all') {
    return true;
  }
  if (employeeCount === null || employeeCount === undefined) {
    return false;
  }

  if (range === '1-10') return employeeCount >= 1 && employeeCount <= 10;
  if (range === '11-50') return employeeCount >= 11 && employeeCount <= 50;
  if (range === '51-200') return employeeCount >= 51 && employeeCount <= 200;
  if (range === '201-500') return employeeCount >= 201 && employeeCount <= 500;
  if (range === '500+') return employeeCount > 500;
  return true;
};

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const { data: agents = [] } = useAgents();

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState<CompanySizeRange>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | typeof STATUS_OPTIONS[number]>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent-updates');
  const [page, setPage] = useState(1);

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterRef.current && !filterRef.current.contains(target)) {
        setFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(target)) {
        setSortOpen(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const sourceOptions = useMemo(() => {
    const values = new Set<string>();
    leads.forEach((lead: any) => {
      if (lead.source) {
        values.add(lead.source);
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const filteredAndSorted = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = leads.filter((lead: any) => {
      const matchSearch =
        !query ||
        (lead.name ?? '').toLowerCase().includes(query) ||
        (lead.companyName ?? '').toLowerCase().includes(query) ||
        (lead.email ?? '').toLowerCase().includes(query) ||
        (lead.phone ?? '').toLowerCase().includes(query);

      const matchState = stateFilter === 'all' || (lead.state ?? '').toLowerCase() === stateFilter.toLowerCase();
      const matchSize = inCompanySizeRange(lead.employeeCount, sizeFilter);
      const matchOwner = ownerFilter === 'all' || lead.assignedAgent === ownerFilter;
      const matchStatusFilter = matchesStatus(lead.status, statusFilter === 'all' ? undefined : statusFilter);
      const matchSource = sourceFilter === 'all' || lead.source === sourceFilter;

      return matchSearch && matchState && matchSize && matchOwner && matchStatusFilter && matchSource;
    });

    filtered.sort((left: any, right: any) => {
      if (sortBy === 'size-asc') {
        return (left.employeeCount ?? Number.MAX_SAFE_INTEGER) - (right.employeeCount ?? Number.MAX_SAFE_INTEGER);
      }
      if (sortBy === 'size-desc') {
        return (right.employeeCount ?? -1) - (left.employeeCount ?? -1);
      }
      if (sortBy === 'new-old') {
        return new Date(right.date ?? 0).getTime() - new Date(left.date ?? 0).getTime();
      }
      if (sortBy === 'old-new') {
        return new Date(left.date ?? 0).getTime() - new Date(right.date ?? 0).getTime();
      }
      return new Date(right.lastActivity ?? 0).getTime() - new Date(left.lastActivity ?? 0).getTime();
    });

    return filtered;
  }, [leads, ownerFilter, search, sizeFilter, sortBy, sourceFilter, stateFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filteredAndSorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeFilterCount =
    (stateFilter !== 'all' ? 1 : 0) +
    (sizeFilter !== 'all' ? 1 : 0) +
    (ownerFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setStateFilter('all');
    setSizeFilter('all');
    setOwnerFilter('all');
    setStatusFilter('all');
    setSourceFilter('all');
    setPage(1);
  };

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
        <h1 className="text-2xl font-bold text-foreground">Database</h1>
        <p className="text-sm text-muted-foreground mt-1">{filteredAndSorted.length} of {leads.length} leads</p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, company, phone, or email..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 px-4"
              onClick={() => {
                setFilterOpen((value) => !value);
                setSortOpen(false);
              }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-elevated z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Filters</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Clear all
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Location (State)</label>
                    <select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1); }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                      <option value="all">All States</option>
                      {US_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Company Size</label>
                    <select value={sizeFilter} onChange={(event) => { setSizeFilter(event.target.value as CompanySizeRange); setPage(1); }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                      <option value="all">All Sizes</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Lead Owner</label>
                    <select value={ownerFilter} onChange={(event) => { setOwnerFilter(event.target.value); setPage(1); }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                      <option value="all">All Owners</option>
                      {agents.map((agent: any) => (
                        <option key={agent.id} value={agent.name}>{agent.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                    <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as any); setPage(1); }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                      <option value="all">All Statuses</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Lead Source</label>
                    <select value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value); setPage(1); }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                      <option value="all">All Sources</option>
                      {sourceOptions.map((source) => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={sortRef}>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 px-4"
              onClick={() => {
                setSortOpen((value) => !value);
                setFilterOpen(false);
              }}
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>

            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-elevated z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                  <p className="text-sm font-semibold text-foreground">Sort By</p>
                </div>
                <div className="p-3 space-y-1">
                  {SORT_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-secondary/40 cursor-pointer">
                      <input
                        type="radio"
                        name="sortOption"
                        value={option.value}
                        checked={sortBy === option.value}
                        onChange={() => {
                          setSortBy(option.value);
                          setPage(1);
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-foreground">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LeadTable leads={paginated} />

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredAndSorted.length)} of {filteredAndSorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <span className="text-sm font-medium text-foreground px-2">
              {safePage} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}