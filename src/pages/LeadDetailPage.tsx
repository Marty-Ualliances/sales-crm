import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, User, Calendar, FileText, RefreshCw, Loader2, Building2, MapPin, Globe, Linkedin, Users, CheckCircle, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLead, useCalls, useCompleteFollowUp, useUpdateLead } from '@/hooks/useApi';
import { LeadStatus } from '@/types/leads';
import { toast } from 'sonner';
import { useState } from 'react';

/** Strips non-digit chars (keeps leading +) for tel: URI */
function toTelUri(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

const statusColors: Record<LeadStatus, string> = {
  'New': 'bg-primary/10 text-primary border-primary/20',
  'Contacted': 'bg-warning/10 text-warning border-warning/20',
  'Follow-up': 'bg-accent text-accent-foreground border-accent-foreground/20',
  'Closed': 'bg-success/10 text-success border-success/20',
  'Lost': 'bg-muted text-muted-foreground border-border',
  'Reshedule': 'bg-warning/10 text-warning border-warning/20',
  'No Show': 'bg-destructive/10 text-destructive border-destructive/20',
};

const activityIcons: Record<string, any> = {
  'call': Phone,
  'follow-up': Calendar,
  'note': FileText,
  'status-change': RefreshCw,
};

const activityColors: Record<string, string> = {
  'call': 'bg-success/10 text-success',
  'follow-up': 'bg-warning/10 text-warning',
  'note': 'bg-muted text-muted-foreground',
  'status-change': 'bg-primary/10 text-primary',
};

export default function LeadDetailPage() {
  const { leadId } = useParams();
  const { data: lead, isLoading } = useLead(leadId || '');
  const { data: allCalls = [] } = useCalls();
  const completeFollowUp = useCompleteFollowUp();
  const updateLead = useUpdateLead();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const location = useLocation();
  const basePath = location.pathname.startsWith('/sdr') ? '/sdr' : '/admin';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-foreground mb-2">Lead not found</h2>
        <Link to={`${basePath}/leads`}><Button variant="outline">Back to Leads</Button></Link>
      </div>
    );
  }

  const leadCalls = allCalls.filter((c: any) => c.leadId === lead.id || c.leadId === lead._id);

  const handleCall = (phone?: string) => {
    const phoneNumber = phone || lead.phone;
    if (!phoneNumber) {
      toast.error('No phone number available');
      return;
    }
    // Open the system dialer (or Zoom Workspace if it's the default tel: handler)
    window.location.href = toTelUri(phoneNumber);
    toast.info('Opening phone dialer...');
  };

  const handleCompleteFollowUp = async () => {
    try {
      await completeFollowUp.mutateAsync(lead.id);
      toast.success('Follow-up completed');
    } catch {
      toast.error('Failed to complete follow-up');
    }
  };

  const handleStatusChange = async (status: LeadStatus) => {
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { status } });
      toast.success(`Status changed to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { notes } });
      setEditingNotes(false);
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    }
  };

  // All phone numbers for display
  const phones = [
    { label: 'Work Direct', value: lead.workDirectPhone },
    { label: 'Mobile', value: lead.mobilePhone },
    { label: 'Home', value: lead.homePhone },
    { label: 'Corporate', value: lead.corporatePhone },
    { label: 'Company', value: lead.companyPhone },
    { label: 'Other', value: lead.otherPhone },
  ].filter(p => p.value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`${basePath}/leads`}>
            <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
            <p className="text-sm text-muted-foreground">
              {lead.title && `${lead.title} · `}{lead.companyName || 'Lead Details'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {lead.phone && (
            <a href={toTelUri(lead.phone)}>
              <Button size="sm">
                <PhoneCall className="h-4 w-4 mr-1" />
                Call Now
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ── Left Column: Contact + Company Info (Side by Side) ── */}
        <div className="space-y-6">
          {/* Contact & Company Info - Combined */}
          <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Contact & Company Info</h3>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[lead.status]}`}>
                {lead.status}
              </span>
            </div>

            {/* Side by Side Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Contact Info Column */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                {[
                  { icon: User, label: 'Name', value: lead.name },
                  { icon: Building2, label: 'Title', value: lead.title },
                  { icon: Mail, label: 'Email', value: lead.email },
                  { icon: User, label: 'Assigned Agent', value: lead.assignedAgent },
                  { icon: Calendar, label: 'Date Added', value: lead.date },
                  { icon: RefreshCw, label: 'Source', value: lead.source },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="flex items-start gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary shrink-0">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground break-words">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Company Info Column */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</p>
                {[
                  { icon: Building2, label: 'Company', value: lead.companyName },
                  { icon: Users, label: 'Employees', value: lead.employees ? String(lead.employees) : null },
                  { icon: MapPin, label: 'Location', value: (lead.city || lead.state) ? `${lead.city || ''}${lead.city && lead.state ? ', ' : ''}${lead.state || ''}` : null },
                  { icon: Globe, label: 'Website', value: lead.website, link: true },
                  { icon: Linkedin, label: 'Person LinkedIn', value: lead.personLinkedinUrl, link: true },
                  { icon: Linkedin, label: 'Company LinkedIn', value: lead.companyLinkedinUrl, link: true },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="flex items-start gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary shrink-0">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      {item.link ? (
                        <a href={item.value!} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-foreground break-words">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status change */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Change Status</p>
              <div className="flex flex-wrap gap-1.5">
                {(['New', 'Contacted', 'Follow-up', 'Reshedule', 'No Show', 'Closed', 'Lost'] as LeadStatus[]).map(s => (
                  <Button key={s} variant={lead.status === s ? 'default' : 'outline'} size="sm"
                    className="h-7 text-xs" onClick={() => handleStatusChange(s)}
                    disabled={lead.status === s}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Follow-up */}
            {lead.nextFollowUp && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Next Follow-up</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{lead.nextFollowUp}</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCompleteFollowUp}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Complete
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Phone Numbers */}
          {phones.length > 0 && (
            <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Phone Numbers</h3>
              {phones.map(p => (
                <div key={p.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{p.label}</p>
                      <a href={toTelUri(p.value)} className="text-sm font-medium text-primary hover:underline">{p.value}</a>
                    </div>
                  </div>
                  <a href={toTelUri(p.value)} title="Call this number">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                      <PhoneCall className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Notes</h3>
              {!editingNotes && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setNotes(lead.notes || ''); setEditingNotes(true); }}>
                  Edit
                </Button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{lead.notes || 'No notes yet.'}</p>
            )}
          </div>
        </div>

        {/* ── Right Column: Activity Timeline + Call History ── */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {lead.activities?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((activity: any) => {
                const Icon = activityIcons[activity.type] || FileText;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityColors[activity.type] || 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.agent} · {activity.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!lead.activities || lead.activities.length === 0) && (
                <p className="text-sm text-muted-foreground">No activities recorded yet.</p>
              )}
            </div>
          </div>

          {/* Call History */}
          <div className="rounded-xl border border-border bg-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Call History</h3>
              <span className="text-sm text-muted-foreground">{leadCalls.length} calls · {lead.callCount || 0} total</span>
            </div>
            {leadCalls.length > 0 ? (
              <div className="space-y-3">
                {leadCalls.map((call: any) => (
                  <Link key={call.id} to={`${basePath}/calls/${call.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${call.status === 'Completed' ? 'bg-success/10 text-success' : call.status === 'Missed' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{call.date} at {call.time} — {call.duration}</p>
                      <p className="text-xs text-muted-foreground">{call.notes}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${call.status === 'Completed' ? 'bg-success/10 text-success border-success/20' : call.status === 'Missed' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                      {call.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No calls recorded yet. Click "Call Now" to make the first call.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
