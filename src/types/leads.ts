export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Closed' | 'Lost' | 'Reshedule' | 'No Show';

export type LeadSource = 'CSV Import' | 'Manual' | 'Website' | 'Referral' | 'LinkedIn' | 'Other';

export interface Lead {
  id: string;
  // Core
  date: string;
  source: LeadSource;
  name: string;
  title: string;
  companyName: string;
  email: string;
  // Phones
  workDirectPhone: string;
  homePhone: string;
  mobilePhone: string;
  corporatePhone: string;
  otherPhone: string;
  companyPhone: string;
  // Company info
  employees: number | null;
  personLinkedinUrl: string;
  website: string;
  companyLinkedinUrl: string;
  city: string;
  state: string;
  // CRM fields
  status: LeadStatus;
  assignedAgent: string;
  notes: string;
  nextFollowUp: string | null;
  callCount: number;
  lastActivity: string;
  revenue?: number;
  activities: Activity[];
  // Convenience – primary phone derived from first available
  phone: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'follow-up' | 'note' | 'status-change';
  description: string;
  timestamp: string;
  agent: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'agent';
  leadsAssigned: number;
  callsMade: number;
  followUpsCompleted: number;
  followUpsPending: number;
  conversionRate: number;
  revenueClosed: number;
}

export interface Call {
  id: string;
  leadId: string;
  leadName: string;
  agentName: string;
  date: string;
  time: string;
  duration: string;
  status: 'Completed' | 'Missed' | 'Follow-up';
  notes: string;
  hasRecording: boolean;
}

export interface Notification {
  id: string;
  type: 'follow-up' | 'overdue' | 'assignment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  leadId?: string;
}
