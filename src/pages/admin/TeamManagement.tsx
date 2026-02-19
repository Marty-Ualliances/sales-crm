import { useAgents, useLeads, useCreateAgent, useDeleteAgent } from '@/hooks/useApi';
import { Phone, CheckCircle, Clock, Users, Search, UserPlus, Mail, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TeamManagement() {
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: leads = [] } = useLeads();
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '', role: 'sdr' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const filtered = agents.filter((a: any) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddAgent = async () => {
    if (!newAgent.name || !newAgent.email || !newAgent.password) {
      toast.error('Please fill in all fields including password');
      return;
    }
    try {
      await createAgent.mutateAsync({
        name: newAgent.name,
        email: newAgent.email,
        password: newAgent.password,
        role: newAgent.role as 'admin' | 'sdr' | 'hr' | 'leadgen',
      });
      toast.success(`Agent "${newAgent.name}" added successfully`);
      setOpenDialog(false);
      setNewAgent({ name: '', email: '', password: '', role: 'sdr' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add agent');
    }
  };

  const handleDeleteAgent = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteAgent.mutateAsync(deleteConfirm.id);
      toast.success(`Agent "${deleteConfirm.name}" removed`);
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete agent');
    }
  };

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{agents.length} team members</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0 gap-2">
              <UserPlus className="h-4 w-4" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
              <DialogDescription>Create a new team member account</DialogDescription>
            </DialogHeader>
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Agent name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@example.com"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Temporary password"
                  value={newAgent.password}
                  onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newAgent.role} onValueChange={(value) => setNewAgent({ ...newAgent, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sdr">SDR Agent</SelectItem>
                    <SelectItem value="leadgen">Lead Gen</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleAddAgent} disabled={createAgent.isPending} className="gradient-primary border-0">
                {createAgent.isPending ? 'Adding...' : 'Add Agent'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Agent Cards */}
      <div className="grid gap-4 md:grid-cols-2 auto-rows-fr">
        {filtered.map((agent: any, idx: number) => {
          const agentLeads = leads.filter((l: any) => l.assignedAgent === agent.name);
          return (
            <div
              key={agent.id}
              className="rounded-xl border border-border bg-card p-6 shadow-card hover:-translate-y-1 hover:shadow-[0_0_24px_4px_hsl(var(--primary)/0.12)] transition-all duration-300 glow-card animate-slide-up flex flex-col"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-base font-medium">
                    {agent.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{agent.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {agent.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={agent.role === 'admin' ? 'default' : 'secondary'}
                    className={`text-xs ${agent.role === 'leadgen' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : ''}`}
                  >
                    {agent.role === 'leadgen' ? 'Lead Gen' : agent.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirm({ id: agent.id, name: agent.name })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { icon: Users, label: 'Active Leads', value: agentLeads.length },
                  { icon: Phone, label: 'Calls Made', value: agent.callsMade },
                  { icon: CheckCircle, label: 'Follow-ups Done', value: agent.followUpsCompleted },
                  { icon: Clock, label: 'Pending', value: agent.followUpsPending, danger: agent.followUpsPending > 10 },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-lg bg-secondary/50 p-2.5 text-center">
                    <kpi.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${kpi.danger ? 'text-destructive' : 'text-primary'}`} />
                    <p className={`text-lg font-bold ${kpi.danger ? 'text-destructive' : 'text-foreground'}`}>{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Assigned leads preview */}
              <div className="border-t border-border pt-3 mt-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2">Assigned Leads</p>
                <div className="flex flex-wrap gap-1.5">
                  {agentLeads.slice(0, 4).map(lead => (
                    <Badge key={lead.id} variant="outline" className="text-xs">
                      {lead.name}
                    </Badge>
                  ))}
                  {agentLeads.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{agentLeads.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">{deleteConfirm?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAgent}
              disabled={deleteAgent.isPending}
            >
              {deleteAgent.isPending ? 'Removing...' : 'Remove Agent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
