import { Lead, Agent, Notification, Call } from '@/types/leads';

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const ago = (days: number) => fmt(new Date(today.getTime() - days * 86400000));
const future = (days: number) => fmt(new Date(today.getTime() + days * 86400000));

export const mockAgents: Agent[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@insurepro.com', avatar: 'SJ', role: 'admin', leadsAssigned: 45, callsMade: 128, followUpsCompleted: 34, followUpsPending: 8, conversionRate: 24, revenueClosed: 128500 },
  { id: '2', name: 'Mike Chen', email: 'mike@insurepro.com', avatar: 'MC', role: 'agent', leadsAssigned: 38, callsMade: 96, followUpsCompleted: 28, followUpsPending: 12, conversionRate: 18, revenueClosed: 87200 },
  { id: '3', name: 'Emily Davis', email: 'emily@insurepro.com', avatar: 'ED', role: 'agent', leadsAssigned: 52, callsMade: 145, followUpsCompleted: 41, followUpsPending: 5, conversionRate: 28, revenueClosed: 156800 },
  { id: '4', name: 'James Wilson', email: 'james@insurepro.com', avatar: 'JW', role: 'agent', leadsAssigned: 31, callsMade: 72, followUpsCompleted: 19, followUpsPending: 15, conversionRate: 15, revenueClosed: 54300 },
];

export const mockLeads: Lead[] = [
  { id: '1', name: 'Robert Smith', phone: '(555) 123-4567', email: 'robert@email.com', status: 'New', assignedAgent: 'Sarah Johnson', nextFollowUp: future(1), callCount: 0, lastActivity: ago(0), notes: 'Interested in life insurance', activities: [{ id: 'a1', type: 'note', description: 'Lead imported via CSV', timestamp: ago(0), agent: 'Sarah Johnson' }] },
  { id: '2', name: 'Jennifer Brown', phone: '(555) 234-5678', email: 'jen@email.com', status: 'Contacted', assignedAgent: 'Mike Chen', nextFollowUp: ago(1), callCount: 2, lastActivity: ago(1), notes: 'Needs auto + home bundle', activities: [{ id: 'a2', type: 'call', description: 'Initial call - interested', timestamp: ago(2), agent: 'Mike Chen' }, { id: 'a3', type: 'call', description: 'Follow-up call - requested quote', timestamp: ago(1), agent: 'Mike Chen' }] },
  { id: '3', name: 'David Martinez', phone: '(555) 345-6789', email: 'david@email.com', status: 'Follow-up', assignedAgent: 'Emily Davis', nextFollowUp: ago(3), callCount: 4, lastActivity: ago(2), notes: 'Comparing with competitor', activities: [{ id: 'a4', type: 'call', description: 'Discussed policy options', timestamp: ago(5), agent: 'Emily Davis' }, { id: 'a5', type: 'follow-up', description: 'Scheduled follow-up', timestamp: ago(3), agent: 'Emily Davis' }] },
  { id: '4', name: 'Lisa Thompson', phone: '(555) 456-7890', email: 'lisa@email.com', status: 'Closed', assignedAgent: 'Sarah Johnson', nextFollowUp: null, callCount: 6, lastActivity: ago(1), notes: 'Signed life insurance policy', activities: [{ id: 'a6', type: 'status-change', description: 'Status changed to Closed', timestamp: ago(1), agent: 'Sarah Johnson' }] },
  { id: '5', name: 'William Garcia', phone: '(555) 567-8901', email: 'will@email.com', status: 'Follow-up', assignedAgent: 'James Wilson', nextFollowUp: future(2), callCount: 1, lastActivity: ago(3), notes: 'Wants family health plan', activities: [{ id: 'a7', type: 'call', description: 'First contact call', timestamp: ago(3), agent: 'James Wilson' }] },
  { id: '6', name: 'Amanda White', phone: '(555) 678-9012', email: 'amanda@email.com', status: 'Lost', assignedAgent: 'Mike Chen', nextFollowUp: null, callCount: 3, lastActivity: ago(7), notes: 'Went with competitor', activities: [{ id: 'a8', type: 'status-change', description: 'Status changed to Lost', timestamp: ago(7), agent: 'Mike Chen' }] },
  { id: '7', name: 'Thomas Anderson', phone: '(555) 789-0123', email: 'thomas@email.com', status: 'New', assignedAgent: 'Emily Davis', nextFollowUp: future(0), callCount: 0, lastActivity: ago(0), notes: 'Business insurance inquiry', activities: [{ id: 'a9', type: 'note', description: 'Lead imported via CSV', timestamp: ago(0), agent: 'Emily Davis' }] },
  { id: '8', name: 'Jessica Lee', phone: '(555) 890-1234', email: 'jessica@email.com', status: 'Contacted', assignedAgent: 'Sarah Johnson', nextFollowUp: ago(2), callCount: 1, lastActivity: ago(2), notes: 'Renters insurance needed', activities: [{ id: 'a10', type: 'call', description: 'Intro call completed', timestamp: ago(2), agent: 'Sarah Johnson' }] },
  { id: '9', name: 'Christopher Hall', phone: '(555) 901-2345', email: 'chris@email.com', status: 'Follow-up', assignedAgent: 'James Wilson', nextFollowUp: ago(5), callCount: 2, lastActivity: ago(4), notes: 'Senior health plan', activities: [{ id: 'a11', type: 'follow-up', description: 'Follow-up scheduled', timestamp: ago(5), agent: 'James Wilson' }] },
  { id: '10', name: 'Sarah Kim', phone: '(555) 012-3456', email: 'sarahk@email.com', status: 'Contacted', assignedAgent: 'Emily Davis', nextFollowUp: future(3), callCount: 1, lastActivity: ago(1), notes: 'Auto insurance quote', activities: [{ id: 'a12', type: 'call', description: 'Initial contact', timestamp: ago(1), agent: 'Emily Davis' }] },
];

export const mockNotifications: Notification[] = [
  { id: '1', type: 'overdue', title: 'Overdue Follow-up', message: 'Follow-up with David Martinez is 3 days overdue', timestamp: ago(0), read: false, leadId: '3' },
  { id: '2', type: 'overdue', title: 'Overdue Follow-up', message: 'Follow-up with Christopher Hall is 5 days overdue', timestamp: ago(0), read: false, leadId: '9' },
  { id: '3', type: 'follow-up', title: 'Follow-up Today', message: 'Follow-up with Thomas Anderson is due today', timestamp: ago(0), read: false, leadId: '7' },
  { id: '4', type: 'overdue', title: 'Overdue Follow-up', message: 'Follow-up with Jennifer Brown is 1 day overdue', timestamp: ago(0), read: false, leadId: '2' },
  { id: '5', type: 'assignment', title: 'New Lead Assigned', message: 'Robert Smith has been assigned to you', timestamp: ago(0), read: true },
  { id: '6', type: 'system', title: 'CSV Import Complete', message: '15 leads imported successfully', timestamp: ago(1), read: true },
];

export const getOverdueCount = () => {
  return mockLeads.filter(l => l.nextFollowUp && new Date(l.nextFollowUp) < today && l.status !== 'Closed' && l.status !== 'Lost').length;
};

export const getKPIs = () => ({
  totalLeads: mockLeads.length,
  totalCalls: mockLeads.reduce((sum, l) => sum + l.callCount, 0),
  recentActivity: mockLeads.filter(l => new Date(l.lastActivity) >= new Date(today.getTime() - 7 * 86400000)).length,
  followUpsRemaining: mockLeads.filter(l => l.nextFollowUp && l.status !== 'Closed' && l.status !== 'Lost').length,
  overdueFollowUps: getOverdueCount(),
  appointmentsBooked: 12,
  conversionRate: Math.round((mockLeads.filter(l => l.status === 'Closed').length / mockLeads.length) * 100),
});

export const mockCalls: Call[] = [
  { id: 'c1', leadId: '2', leadName: 'Jennifer Brown', agentName: 'Mike Chen', date: ago(1), time: '10:30 AM', duration: '6 min', status: 'Completed', notes: 'Follow-up call - requested quote', hasRecording: true },
  { id: 'c2', leadId: '2', leadName: 'Jennifer Brown', agentName: 'Mike Chen', date: ago(2), time: '2:15 PM', duration: '4 min', status: 'Completed', notes: 'Initial call - interested', hasRecording: true },
  { id: 'c3', leadId: '3', leadName: 'David Martinez', agentName: 'Emily Davis', date: ago(5), time: '11:00 AM', duration: '8 min', status: 'Completed', notes: 'Discussed policy options', hasRecording: false },
  { id: 'c4', leadId: '5', leadName: 'William Garcia', agentName: 'James Wilson', date: ago(3), time: '9:45 AM', duration: '3 min', status: 'Follow-up', notes: 'First contact call', hasRecording: true },
  { id: 'c5', leadId: '8', leadName: 'Jessica Lee', agentName: 'Sarah Johnson', date: ago(2), time: '3:00 PM', duration: '5 min', status: 'Completed', notes: 'Intro call completed', hasRecording: false },
  { id: 'c6', leadId: '10', leadName: 'Sarah Kim', agentName: 'Emily Davis', date: ago(1), time: '1:20 PM', duration: '7 min', status: 'Completed', notes: 'Initial contact', hasRecording: true },
  { id: 'c7', leadId: '3', leadName: 'David Martinez', agentName: 'Emily Davis', date: ago(7), time: '4:00 PM', duration: '0 min', status: 'Missed', notes: 'No answer', hasRecording: false },
  { id: 'c8', leadId: '6', leadName: 'Amanda White', agentName: 'Mike Chen', date: ago(8), time: '10:00 AM', duration: '12 min', status: 'Completed', notes: 'Extended discussion about coverage', hasRecording: true },
  { id: 'c9', leadId: '4', leadName: 'Lisa Thompson', agentName: 'Sarah Johnson', date: ago(3), time: '11:30 AM', duration: '15 min', status: 'Completed', notes: 'Closing call - signed policy', hasRecording: true },
  { id: 'c10', leadId: '9', leadName: 'Christopher Hall', agentName: 'James Wilson', date: ago(4), time: '2:00 PM', duration: '4 min', status: 'Follow-up', notes: 'Needs more info on senior plans', hasRecording: false },
  { id: 'c11', leadId: '1', leadName: 'Robert Smith', agentName: 'Sarah Johnson', date: ago(0), time: '9:00 AM', duration: '2 min', status: 'Missed', notes: 'Voicemail left', hasRecording: false },
  { id: 'c12', leadId: '7', leadName: 'Thomas Anderson', agentName: 'Emily Davis', date: ago(0), time: '10:15 AM', duration: '6 min', status: 'Completed', notes: 'Business insurance inquiry details', hasRecording: true },
];
