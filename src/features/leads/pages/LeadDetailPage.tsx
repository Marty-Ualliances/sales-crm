'use client';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, User, Calendar, FileText, RefreshCw, Loader2, Building2, MapPin, Globe, Linkedin, Users, CheckCircle, PhoneCall, Send, ShieldCheck, AlertTriangle, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLead, useCalls, useCompleteFollowUp, useUpdateLead, useLeads, useCreateCall, useMeetings, useCreateMeeting, useUpdateMeeting } from '@/hooks/useApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { LeadStatus } from '@/features/leads/types/leads';
import { getStageBadgeClass, PIPELINE_STAGES, PRIORITIES, getPriorityBadgeClass, SEGMENTS, SOURCE_CHANNELS, checkQualityGate } from '@/features/leads/constants/pipeline';
import { CADENCE_TEMPLATES, TOUCH_TYPE_CONFIG, getCadenceTasks } from '@/features/leads/constants/cadences';
import { toast } from 'sonner';
import { useState } from 'react';
import { MeetingBookedModal, MeetingBookedData } from '@/features/meetings/components/MeetingBookedModal';
import { MeetingCompletedModal } from '@/features/meetings/components/MeetingCompletedModal';

/** Strips non-digit chars (keeps leading +) for tel: URI */
function toTelUri(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

const activityIcons: Record<string, any> = {
  'call': Phone,
  'follow-up': Calendar,
  'note': FileText,
  'status-change': RefreshCw,
  'email': Send,
  'linkedin': Linkedin,
  'cadence-touch': CheckCircle,
};

const activityColors: Record<string, string> = {
  'call': 'bg-success/10 text-success',
  'follow-up': 'bg-warning/10 text-warning',
  'note': 'bg-muted text-muted-foreground',
  'status-change': 'bg-primary/10 text-primary',
  'email': 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'linkedin': 'bg-sky-100/50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  'cadence-touch': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params?.leadId as string | undefined;
  const { data: lead, isLoading } = useLead(leadId ?? '');
  const { data: allCalls = [] } = useCalls();
  const completeFollowUp = useCompleteFollowUp();
  const updateLead = useUpdateLead();
  const createCall = useCreateCall();
  const { user } = useAuth();
  const { data: allLeads = [] } = useLeads();
  const { data: meetings = [] } = useMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [nextStepPrompt, setNextStepPrompt] = useState<{ status: LeadStatus } | null>(null);
  const [nextStepDate, setNextStepDate] = useState('');
  const [nextStepNote, setNextStepNote] = useState('');
  const [activeTab, setActiveTab] = useState<'team' | 'activity'>('team');

  const [showMeetingBookedModal, setShowMeetingBookedModal] = useState(false);
  const [showMeetingCompletedModal, setShowMeetingCompletedModal] = useState(false);

  const pathname = usePathname() ?? '';
  const basePath = pathname.startsWith('/sdr') ? '/sdr' :
    pathname.startsWith('/hr') ? '/hr' :
      pathname.startsWith('/leadgen') ? '/leadgen' : '/admin';

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
        <Link href={`${basePath}/leads`}><Button variant="outline">Back to Leads</Button></Link>
      </div>
    );
  }

  const leadCalls = allCalls.filter((c: any) => c.leadId === lead.id || c.leadId === lead._id);

  const handleCall = async (phoneToCall?: string) => {
    const phoneNumber = phoneToCall || lead.phone || lead.companyPhone;
    if (!phoneNumber) {
      toast.error('No phone number available');
      return;
    }

    try {
      await createCall.mutateAsync({
        leadId: lead.id || lead._id,
        leadName: lead.name,
        agentName: user?.name || 'Unknown',
        date: new Date(),
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        duration: '0 min',
        status: 'Completed',
        notes: 'Call initiated from Lead Details',
        hasRecording: false,
      });
    } catch (error) {
      console.error('Failed to log call:', error);
    }

    // Open the system dialer
    window.location.href = toTelUri(phoneNumber);
    toast.success('Call logged and opening dialer...');
  };

  const handleCompleteFollowUp = async () => {
    try {
      await completeFollowUp.mutateAsync(lead.id);
      toast.success('Follow-up completed');
    } catch {
      toast.error('Failed to complete follow-up');
    }
  };

  const NEXT_STEP_STAGES: LeadStatus[] = ['Qualified', 'Proposal Sent', 'Negotiation'];

  const handleStatusChange = async (status: LeadStatus) => {
    if (status === 'Meeting Booked') {
      setShowMeetingBookedModal(true);
      return;
    }
    if (status === 'Meeting Completed') {
      setShowMeetingCompletedModal(true);
      return;
    }
    if (NEXT_STEP_STAGES.includes(status)) {
      setNextStepDate('');
      setNextStepNote('');
      setNextStepPrompt({ status });
      return;
    }
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { status } });
      toast.success(`Status changed to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const confirmStatusWithNextStep = async () => {
    if (!nextStepPrompt) return;
    try {
      const updateData: any = { status: nextStepPrompt.status };
      if (nextStepDate) updateData.nextFollowUp = nextStepDate;
      if (nextStepNote) {
        updateData.activities = [...(lead.activities || []), {
          type: 'note',
          description: `Next step: ${nextStepNote}`,
          timestamp: new Date().toISOString(),
          agent: lead.assignedAgent || 'User',
        }];
      }
      await updateLead.mutateAsync({ id: lead.id, data: updateData });
      toast.success(`Status changed to ${nextStepPrompt.status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setNextStepPrompt(null);
    }
  };

  const onMeetingBooked = async (data: MeetingBookedData) => {
    try {
      await createMeeting.mutateAsync({
        title: `Meeting with ${lead.name}`,
        date: data.date,
        time: data.time,
        duration: 30,
        leadId: lead.id,
        leadName: lead.name,
        ams: data.ams,
        description: data.notes,
        status: 'scheduled'
      });
      await updateLead.mutateAsync({ id: lead.id, data: { status: 'Meeting Booked' } });
      toast.success('Meeting booked successfully');
    } catch {
      toast.error('Failed to book meeting');
    }
  };

  const onMeetingCompleted = async (driveLink: string) => {
    try {
      const activeLeadMeetings = meetings.filter((m: any) => (m.leadId === lead.id || m.leadId === lead._id) && m.status === 'scheduled');
      if (activeLeadMeetings.length > 0) {
        const meetingToUpdate = activeLeadMeetings[0];
        await updateMeeting.mutateAsync({ id: meetingToUpdate.id, data: { status: 'completed', driveLink } });
      }

      await updateLead.mutateAsync({ id: lead.id, data: { status: 'Meeting Completed' } });
      toast.success('Meeting marked as completed');
    } catch {
      toast.error('Failed to complete meeting');
    }
  };


  const handleSaveNotes = async () => {
    try {
      let currentUserName = 'Current User';
      try {
        const storedUser = localStorage.getItem('insurelead_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          currentUserName = parsed.name || 'Current User';
        }
      } catch (e) { }

      const newActivity = {
        type: 'note',
        description: notes,
        timestamp: new Date().toISOString(),
        agent: currentUserName,
      };
      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          activities: [newActivity, ...(lead.activities || [])]
        }
      });
      setEditingNotes(false);
      setNotes('');
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    }
  };

  const handleFieldUpdate = async (data: any) => {
    try {
      await updateLead.mutateAsync({ id: lead.id, data });
      toast.success('Updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleQualificationToggle = async (field: 'rightPerson' | 'realNeed' | 'timing') => {
    const current = lead.qualification || { rightPerson: false, realNeed: false, timing: false, qualifiedAt: null, qualifiedBy: '' };
    const updated = { ...current, [field]: !current[field] };
    // If all 3 are now true and weren't before, mark qualifiedAt
    if (updated.rightPerson && updated.realNeed && updated.timing && !current.qualifiedAt) {
      updated.qualifiedAt = new Date().toISOString() as any;
      updated.qualifiedBy = lead.assignedAgent;
    }
    await handleFieldUpdate({ qualification: updated });
  };

  const checkCadenceTouch = async (touchIdx: number) => {
    if (!lead.cadence) return;
    const updatedTouches = [...lead.cadence.touches];
    updatedTouches[touchIdx] = { ...updatedTouches[touchIdx], completed: true, completedAt: new Date().toISOString() };

    // Create activity
    const touch = updatedTouches[touchIdx];
    const activityDesc = `Cadence touch completed: ${touch.type} (Day ${touch.day})`;

    // Optimistic update
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          cadence: { ...lead.cadence, touches: updatedTouches },
          activities: [...(lead.activities || []), {
            type: 'cadence-touch',
            description: activityDesc,
            timestamp: new Date().toISOString(),
            agent: lead.assignedAgent || 'System',
          }]
        }
      });
      toast.success('Touch completed');
    } catch {
      toast.error('Failed to update cadence');
    }
  };

  const qualityGate = checkQualityGate(lead);
  const cadenceTasks = getCadenceTasks(lead.cadence);
  const cadenceTemplate = lead.cadence ? CADENCE_TEMPLATES.find(t => t.key === lead.cadence!.type) : null;

  // All phone numbers for display
  const phones = [
    { label: 'Work Direct', value: lead.workDirectPhone },
    { label: 'Mobile', value: lead.mobilePhone },
    { label: 'Home', value: lead.homePhone },
    { label: 'Corporate', value: lead.corporatePhone },
    { label: 'Company', value: lead.companyPhone },
    { label: 'Other', value: lead.otherPhone },
  ].filter(p => p.value);

  // Warning: Meeting Completed with no next step
  const showNoNextStepWarning =
    (lead.status === 'Meeting Completed' || lead.status === 'Negotiation') &&
    !lead.nextFollowUp;

  // Normalize activities and stageHistory into a single timeline
  const combinedHistory = [
    ...(lead.activities || []),
    ...(lead.stageHistory || []).map((sh: any, idx: number) => ({
      id: `sh-${idx}-${sh.enteredAt}`,
      type: 'status-change',
      description: `Status changed to ${sh.stage}`,
      timestamp: sh.enteredAt,
      agent: sh.agent || 'System',
    }))
  ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const noteActivities = combinedHistory.filter((a: any) => a.type === 'note');
  const nonNoteActivities = combinedHistory.filter((a: any) => a.type !== 'note');

  return (
    <>
      <div className="space-y-6">
        {/* No next-step warning */}
        {showNoNextStepWarning && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No next step set</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">This lead is in <strong>{lead.status}</strong> but has no follow-up date. Set one below to keep the deal moving.</p>
            </div>
          </div>
        )}

        {/* Next-step modal */}
        {nextStepPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-foreground">Set Next Step</h2>
              <p className="text-sm text-muted-foreground">
                Moving to <span className="font-semibold text-foreground">{nextStepPrompt.status}</span> — define what happens next to keep momentum.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={nextStepDate}
                    onChange={e => setNextStepDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Next Step Note</label>
                  <input
                    value={nextStepNote}
                    onChange={e => setNextStepNote(e.target.value)}
                    placeholder="e.g. Send proposal, Book demo, Follow up on budget..."
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setNextStepPrompt(null)}>Skip</Button>
                <Button onClick={confirmStatusWithNextStep} disabled={updateLead.isPending}>
                  {updateLead.isPending ? 'Saving...' : 'Confirm & Save'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`${basePath}/leads`}>
              <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{lead.name}</h1>
              <p className="text-sm text-muted-foreground">
                {lead.title && `${lead.title} · `}{lead.companyName || 'Lead Details'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 ml-12 sm:ml-0">
            {lead.phone && (
              <Button size="sm" onClick={() => handleCall(lead.phone)}>
                <PhoneCall className="h-4 w-4 mr-1" />
                Call Now
              </Button>
            )}
          </div>
        </div>

        {/* ── Company Card — Full Width ── */}
        <div className="rounded-xl border border-border bg-card shadow-card p-4 sm:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-foreground truncate">{lead.companyName || 'Unknown Company'}</h3>
            </div>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              className={`cursor-pointer appearance-none outline-none inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0 ${getStageBadgeClass(lead.status)}`}
              style={{ paddingRight: '1rem' }}
            >
              {PIPELINE_STAGES.map(s => (
                <option key={s.key} value={s.key} className="bg-background text-foreground">{s.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-border">
            {lead.employees && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employees</p>
                  <p className="text-sm font-semibold text-foreground">{lead.employees}</p>
                </div>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate block">{lead.website.replace(/^https?:\/\//, '')}</a>
                </div>
              </div>
            )}
            {lead.companyLinkedinUrl && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">LinkedIn</p>
                  <a href={lead.companyLinkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate block">Company Page</a>
                </div>
              </div>
            )}
            {lead.companyPhone && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Company Phone</p>
                  <button onClick={() => handleCall(lead.companyPhone)} className="text-sm font-semibold text-primary hover:underline">{lead.companyPhone}</button>
                </div>
              </div>
            )}
            {((lead as any).address || lead.city || lead.state) && (
              <div className="flex items-center gap-3 col-span-2 sm:col-span-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {[(lead as any).address, lead.city, lead.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="border-b border-border">
            <div className="flex space-x-8 px-2">
              <button
                onClick={() => setActiveTab('team')}
                className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'team' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Team & Qualifications
                {activeTab === 'team' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'activity' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Activity & Notes
                {activeTab === 'activity' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-6">
            {activeTab === 'team' ? (
              <div className="space-y-6">
                {/* ── Person Profile Card ── */}
                <div className="rounded-xl border border-border bg-card shadow-card p-4 sm:p-8 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shrink-0">
                      {lead.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'LD'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-foreground">{lead.name}</h3>
                      {lead.title && <p className="text-sm text-muted-foreground mt-0.5">{lead.title}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-border">
                    {lead.email && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium text-foreground truncate">{lead.email}</p>
                        </div>
                      </div>
                    )}
                    {lead.assignedAgent && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Assigned Agent</p>
                          <p className="text-sm font-medium text-foreground truncate">{lead.assignedAgent}</p>
                        </div>
                      </div>
                    )}
                    {lead.date && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Date Added</p>
                          <p className="text-sm font-medium text-foreground">{lead.date}</p>
                        </div>
                      </div>
                    )}
                    {lead.source && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                          <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Source</p>
                          <p className="text-sm font-medium text-foreground">{lead.source}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Team - Full Width */}
                {lead.companyName && (() => {
                  const teamMembers = allLeads.filter((l: any) =>
                    l.companyName === lead.companyName && (l.id || l._id) !== (lead.id || lead._id)
                  );
                  return (
                    <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">Company Team</h3>
                        <span className="text-xs text-muted-foreground">{teamMembers.length} contact{teamMembers.length !== 1 ? 's' : ''}</span>
                      </div>
                      {teamMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {teamMembers.map((member: any) => (
                            <Link
                              key={member.id || member._id}
                              href={`${basePath}/leads/${member.id || member._id}`}
                              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground text-sm font-medium shrink-0">
                                {member.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.title || 'No title'}</p>
                              </div>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${getStageBadgeClass(member.status)}`}>
                                {member.status}
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No other contacts from {lead.companyName} yet.</p>
                      )}
                    </div>
                  );
                })()}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Lead Classification & Qualification */}
                  <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Classification & Qualification</h3>

                    {/* Priority */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Priority</p>
                      <div className="flex gap-1.5">
                        {PRIORITIES.map(p => (
                          <button
                            key={p.key}
                            onClick={() => handleFieldUpdate({ priority: p.key })}
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all ${lead.priority === p.key ? p.badgeClass + ' ring-2 ring-offset-1 ring-current' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                              }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Segment */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Segment</p>
                      <select
                        value={lead.segment || ''}
                        onChange={e => handleFieldUpdate({ segment: e.target.value })}
                        className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
                      >
                        <option value="">— Select —</option>
                        {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Source Channel */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Source Channel</p>
                      <select
                        value={lead.sourceChannel || ''}
                        onChange={e => handleFieldUpdate({ sourceChannel: e.target.value })}
                        className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
                      >
                        <option value="">— Select —</option>
                        {SOURCE_CHANNELS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Quality Gate */}
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        {qualityGate.pass ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Quality Gate {qualityGate.pass ? '✓ Passed' : `— ${qualityGate.missing.length} missing`}
                        </p>
                      </div>
                      {!qualityGate.pass && (
                        <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5 ml-6 list-disc">
                          {qualityGate.missing.map(m => <li key={m}>{m}</li>)}
                        </ul>
                      )}
                    </div>

                    {/* Qualification — 3 Yes Rule */}
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">3 Yes Rule</p>
                      {[
                        { key: 'rightPerson' as const, label: 'Right Person — Decision maker?' },
                        { key: 'realNeed' as const, label: 'Real Need — Admin/quoting/COIs pain?' },
                        { key: 'timing' as const, label: 'Timing — Open to change 30-90 days?' },
                      ].map(q => (
                        <label key={q.key} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={lead.qualification?.[q.key] || false}
                            onChange={() => handleQualificationToggle(q.key)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors">{q.label}</span>
                        </label>
                      ))}
                      {lead.qualification?.qualifiedAt && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          ✓ Qualified on {new Date(lead.qualification.qualifiedAt).toLocaleDateString()} by {lead.qualification.qualifiedBy}
                        </p>
                      )}
                    </div>
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
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Notes Entry */}
                  <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Add Note</h3>
                    <div className="space-y-2">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Type a note (visible across all panels)..."
                        className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleSaveNotes} disabled={!notes.trim()}>
                          Post Note
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Global Notes History */}
                  <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Global Notes History</h3>
                    <div className="space-y-4">
                      {noteActivities.map((note: any) => (
                        <div key={note.id || note.timestamp} className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{note.description}</p>
                          <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[8px] text-primary">{note.agent?.[0] || '?'}</span>
                            {note.agent} · {new Date(note.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {noteActivities.length === 0 && (
                        <p className="text-sm text-muted-foreground">No notes recorded yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Activity Timeline */}
                  <div className="rounded-xl border border-border bg-card shadow-card p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Activity History</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {nonNoteActivities.map((activity: any) => {
                        const Icon = activityIcons[activity.type] || FileText;
                        return (
                          <div key={activity.id || activity.timestamp} className="flex items-start gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityColors[activity.type] || 'bg-muted text-muted-foreground'}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {activity.agent} · {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {nonNoteActivities.length === 0 && (
                        <p className="text-sm text-muted-foreground">No activities recorded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Call History */}
                  <div className="rounded-xl border border-border bg-card shadow-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Call Logs</h3>
                      <span className="text-sm text-muted-foreground">{leadCalls.length} calls</span>
                    </div>
                    {leadCalls.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {leadCalls.map((call: any) => (
                          <Link key={call.id} href={`${basePath}/calls/${call.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
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
                      <p className="text-sm text-muted-foreground">No calls recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div >
      <MeetingBookedModal
        open={showMeetingBookedModal}
        onOpenChange={setShowMeetingBookedModal}
        leadName={lead.name}
        onSubmit={onMeetingBooked}
      />
      <MeetingCompletedModal
        open={showMeetingCompletedModal}
        onOpenChange={setShowMeetingCompletedModal}
        leadName={lead.name}
        onSubmit={onMeetingCompleted}
      />
    </>
  );
}
