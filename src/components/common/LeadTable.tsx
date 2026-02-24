'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Phone, Edit, CheckCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Lead, LeadStatus } from '@/features/leads/types/leads';
import { useCompleteFollowUp, useCreateCall } from '@/hooks/useApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';
import { getStageBadgeClass, getPriorityBadgeClass } from '@/features/leads/constants/pipeline';

/** Strips a phone string down to digits (preserving leading +) for tel: URI */
function toTelUri(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

export default function LeadTable({ leads, compact = false }: { leads: Lead[]; compact?: boolean }) {
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();
  const completeFollowUp = useCompleteFollowUp();
  const createCall = useCreateCall();
  const { user } = useAuth();

  const handleLogCall = async (lead: Lead, note: string) => {
    try {
      const now = new Date();
      await createCall.mutateAsync({
        leadId: lead.id,
        leadName: lead.name,
        agentName: user?.name || 'Unknown Agent',
        date: now.toISOString(),
        time: now.toTimeString().slice(0, 5),
        duration: '0 min',
        status: 'Completed',
        notes: note,
      });
      toast.success(`Call logged for ${lead.name}: ${note}`);
    } catch (error) {
      toast.error('Failed to log call');
    }
  };

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

  const pathname = usePathname() ?? '';
  const basePath = pathname.startsWith('/sdr') ? '/sdr' : '/admin';

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gradient-to-r from-secondary/60 to-secondary/30">
              <th className="text-center px-3 py-3 font-medium text-muted-foreground w-12">#</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date Added</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Company</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Pri</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Agent</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Location</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Source</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Follow-up</th>
              {!compact && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, idx) => {
              const isOverdue = lead.nextFollowUp && lead.nextFollowUp < today && lead.status !== 'Closed Won' && lead.status !== 'Closed Lost';
              return (
                <tr
                  key={lead.id}
                  className={`border-b border-border/40 transition-all duration-200 animate-slide-up group hover:bg-primary/[0.03] ${isOverdue ? 'bg-destructive/5' : idx % 2 === 1 ? 'bg-secondary/20' : ''}`}
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                >
                  <td className="text-center px-3 py-3 text-muted-foreground text-xs font-medium">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div>
                      <Link href={`${basePath}/leads/${lead.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {lead.name}
                      </Link>
                      {lead.title && <p className="text-xs text-muted-foreground">{lead.title}</p>}
                      {lead.phone && (
                        <a href={toTelUri(lead.phone)} className="text-xs text-primary hover:underline md:hidden">{lead.phone}</a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {lead.date ? new Date(lead.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
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
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStageBadgeClass(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getPriorityBadgeClass(lead.priority)}`}>
                      {lead.priority || 'C'}
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
                          <div className="flex items-center">
                            <a href={toTelUri(lead.phone)} title="Call Now">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-r-none">
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-5 text-primary hover:bg-primary/10 rounded-l-none border-l border-primary/20" title="Quick Log Call">
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleLogCall(lead, 'Left VM')} className="cursor-pointer">
                                  Left VM
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleLogCall(lead, 'Not Interested')} className="cursor-pointer">
                                  Not Interested
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleLogCall(lead, 'OOO')} className="cursor-pointer">
                                  OOO
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleLogCall(lead, 'Call back in a while')} className="cursor-pointer">
                                  Call back in a while
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                          title="View Details" onClick={() => router.push(`${basePath}/leads/${lead.id}`)}>
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
