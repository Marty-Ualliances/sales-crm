import { useState, useMemo } from 'react';
import {
  Search, Trash2, Edit2, UserCheck, CheckSquare, Square, ChevronDown,
  Loader2, X, Save, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeads, useAgents, useDeleteLead, useUpdateLead, useBulkAssign } from '@/hooks/useApi';
import { LeadStatus } from '@/types/leads';
import { useToast } from '@/hooks/use-toast';

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Follow-up', 'Closed', 'Lost'];

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'Follow-up': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  Closed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Lost: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  Reshedule: 'bg-purple-100 text-purple-700',
  'No Show': 'bg-gray-100 text-gray-600',
};

interface EditForm {
  name: string;
  email: string;
  companyName: string;
  status: LeadStatus;
  assignedAgent: string;
  notes: string;
  title: string;
  city: string;
  state: string;
}

export default function LeadGenLeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const { data: agents = [] } = useAgents();
  const deleteLead = useDeleteLead();
  const updateLead = useUpdateLead();
  const bulkAssign = useBulkAssign();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAgentName, setBulkAgentName] = useState('');
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', email: '', companyName: '', status: 'New',
    assignedAgent: '', notes: '', title: '', city: '', state: '',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sdrs = useMemo(() => agents.filter((a: any) => a.role === 'sdr'), [agents]);

  const filtered = useMemo(() => leads.filter((l: any) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      l.name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.companyName?.toLowerCase().includes(q) ||
      (l.phone || '').includes(search);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  }), [leads, search, statusFilter]);

  // --- Selection ---
  const allSelected = filtered.length > 0 && filtered.every((l: any) => selectedIds.has(l.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((l: any) => l.id)));
    }
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // --- Bulk Assign ---
  const handleBulkAssign = async () => {
    if (!bulkAgentName || selectedIds.size === 0) return;
    try {
      const result = await bulkAssign.mutateAsync({ leadIds: Array.from(selectedIds), agentName: bulkAgentName });
      toast({ title: 'Bulk assignment complete', description: `${result.updated} lead(s) assigned to ${bulkAgentName}.` });
      setSelectedIds(new Set());
      setBulkAgentName('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // --- Inline single assign ---
  const handleAssignOne = async (leadId: string, agentName: string) => {
    try {
      await updateLead.mutateAsync({ id: leadId, data: { assignedAgent: agentName } });
      toast({ title: 'Lead assigned', description: `Assigned to ${agentName || 'Unassigned'}.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // --- Edit ---
  const openEdit = (lead: any) => {
    setEditingLead(lead);
    setEditForm({
      name: lead.name || '',
      email: lead.email || '',
      companyName: lead.companyName || '',
      status: lead.status || 'New',
      assignedAgent: lead.assignedAgent || '',
      notes: lead.notes || '',
      title: lead.title || '',
      city: lead.city || '',
      state: lead.state || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    try {
      await updateLead.mutateAsync({ id: editingLead.id, data: editForm });
      toast({ title: 'Lead updated' });
      setEditingLead(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // --- Delete ---
  const handleDelete = async (id: string) => {
    try {
      await deleteLead.mutateAsync(id);
      toast({ title: 'Lead deleted' });
      setDeleteConfirmId(null);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} total leads</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, email, company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
          {STATUSES.map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>{s}</Button>
          ))}
        </div>
      </div>

      {/* Bulk assign bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} lead(s) selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkAgentName}
              onChange={e => setBulkAgentName(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            >
              <option value="">Select SDR to assign...</option>
              {sdrs.map((sdr: any) => (
                <option key={sdr.id} value={sdr.name}>{sdr.name}</option>
              ))}
            </select>
            <Button
              size="sm"
              className="gradient-primary border-0"
              onClick={handleBulkAssign}
              disabled={!bulkAgentName || bulkAssign.isPending}
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              {bulkAssign.isPending ? 'Assigning...' : 'Assign'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left w-10">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Assigned To</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No leads found.
                  </td>
                </tr>
              ) : (
                filtered.map((lead: any) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedIds.has(lead.id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleOne(lead.id)} className="text-muted-foreground hover:text-foreground">
                        {selectedIds.has(lead.id)
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.title || '—'}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{lead.companyName || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{lead.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Inline assign dropdown */}
                      <select
                        value={lead.assignedAgent || ''}
                        onChange={e => handleAssignOne(lead.id, e.target.value)}
                        className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground max-w-[140px]"
                      >
                        <option value="">Unassigned</option>
                        {sdrs.map((sdr: any) => (
                          <option key={sdr.id} value={sdr.name}>{sdr.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(lead)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmId(lead.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          Showing {filtered.length} of {leads.length} leads
        </div>
      </div>

      {/* Edit Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Edit Lead</h2>
              <button onClick={() => setEditingLead(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {([
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Title', key: 'title', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Company', key: 'companyName', type: 'text' },
                { label: 'City', key: 'city', type: 'text' },
                { label: 'State', key: 'state', type: 'text' },
              ] as { label: string; key: keyof EditForm; type: string }[]).map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={editForm[field.key] as string}
                    onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as LeadStatus }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Assign to SDR</label>
                <select
                  value={editForm.assignedAgent}
                  onChange={e => setEditForm(prev => ({ ...prev, assignedAgent: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="">Unassigned</option>
                  {sdrs.map((sdr: any) => (
                    <option key={sdr.id} value={sdr.name}>{sdr.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => setEditingLead(null)}>Cancel</Button>
              <Button
                className="gradient-primary border-0"
                onClick={handleSaveEdit}
                disabled={updateLead.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateLead.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl p-6">
            <h2 className="text-base font-semibold text-foreground mb-2">Delete Lead?</h2>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteLead.isPending}
              >
                {deleteLead.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
