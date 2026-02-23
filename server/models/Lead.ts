import mongoose, { Schema, Document } from 'mongoose';
import { PIPELINE_STAGES, PipelineStageKey } from '../constants/pipeline';

export interface IActivity {
  type: 'call' | 'follow-up' | 'note' | 'status-change' | 'email' | 'linkedin';
  description: string;
  timestamp: Date;
  agent: string;
}

export interface IStageHistoryEntry {
  stage: string;
  enteredAt: Date;
  agent: string;
}

export interface IQualification {
  rightPerson: boolean;
  realNeed: boolean;
  timing: boolean;
  qualifiedAt: Date | null;
  qualifiedBy: string;
}

export interface ICadenceTouch {
  day: number;
  type: 'call' | 'email' | 'linkedin';
  completed: boolean;
  completedAt?: Date;
}

export interface ICadence {
  type: 'cold-14day' | 'warm-fast' | 'custom';
  startedAt: Date;
  currentDay: number;
  touches: ICadenceTouch[];
}

export interface ILead extends Document {
  date: Date;
  source: string;
  name: string;
  title: string;
  companyName: string;
  email: string;
  workDirectPhone: string;
  homePhone: string;
  mobilePhone: string;
  corporatePhone: string;
  otherPhone: string;
  companyPhone: string;
  employees: number | null;
  personLinkedinUrl: string;
  website: string;
  companyLinkedinUrl: string;
  address: string;
  city: string;
  state: string;
  status: PipelineStageKey;
  assignedAgent: string;
  addedBy: string;
  closedBy: string;
  closedAt: Date | null;
  closedReason: string;
  notes: string;
  nextFollowUp: Date | null;
  callCount: number;
  lastActivity: Date;
  revenue: number;
  activities: IActivity[];
  stageHistory: IStageHistoryEntry[];
  // Batch 2 fields
  priority: 'A' | 'B' | 'C';
  segment: string;
  sourceChannel: string;
  qualityGatePass: boolean;
  qualification: IQualification;
  // Batch 3 fields
  cadence: ICadence;
}

const StageHistorySchema = new Schema<IStageHistoryEntry>(
  {
    stage: { type: String, required: true },
    enteredAt: { type: Date, default: Date.now },
    agent: { type: String, default: '' },
  },
  { _id: false }
);

const ActivitySchema = new Schema<IActivity>(
  {
    type: { type: String, enum: ['call', 'follow-up', 'note', 'status-change', 'email', 'linkedin'], required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, required: true },
    agent: { type: String, required: true },
  },
  { _id: true }
);

const LeadSchema = new Schema<ILead>(
  {
    date: { type: Date, default: Date.now },
    source: { type: String, enum: ['CSV Import', 'Manual', 'Website', 'Referral', 'LinkedIn', 'Cold – High Fit', 'Warm – Engaged', 'Cold – Quick Sourced', 'Cold – Bulk Data', 'Other'], default: 'Manual' },
    name: { type: String, required: true },
    title: { type: String, default: '' },
    companyName: { type: String, default: '' },
    email: { type: String, default: '' },
    workDirectPhone: { type: String, default: '' },
    homePhone: { type: String, default: '' },
    mobilePhone: { type: String, default: '' },
    corporatePhone: { type: String, default: '' },
    otherPhone: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    employees: { type: Number, default: null },
    personLinkedinUrl: { type: String, default: '' },
    website: { type: String, default: '' },
    companyLinkedinUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    status: { type: String, enum: [...PIPELINE_STAGES], default: 'New Lead' },
    assignedAgent: { type: String, required: true },
    addedBy: { type: String, default: '' },
    closedBy: { type: String, default: '' },
    closedAt: { type: Date, default: null },
    closedReason: { type: String, default: '' },
    notes: { type: String, default: '' },
    nextFollowUp: { type: Date, default: null },
    callCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    revenue: { type: Number, default: 0 },
    activities: [ActivitySchema],
    stageHistory: [StageHistorySchema],
    // Batch 2 fields
    priority: { type: String, enum: ['A', 'B', 'C'], default: 'C' },
    segment: { type: String, enum: ['Insurance', 'Accounting', 'Finance', 'Healthcare', 'Legal', 'Other', ''], default: '' },
    sourceChannel: { type: String, default: '' },
    qualityGatePass: { type: Boolean, default: false },
    qualification: {
      rightPerson: { type: Boolean, default: false },
      realNeed: { type: Boolean, default: false },
      timing: { type: Boolean, default: false },
      qualifiedAt: { type: Date, default: null },
      qualifiedBy: { type: String, default: '' },
    },
    // Batch 3 fields
    cadence: {
      type: { type: String, enum: ['cold-14day', 'warm-fast', 'custom'], default: 'cold-14day' },
      startedAt: { type: Date, default: null },
      currentDay: { type: Number, default: 0 },
      touches: [{
        day: Number,
        type: { type: String, enum: ['call', 'email', 'linkedin'] },
        completed: { type: Boolean, default: false },
        completedAt: Date,
      }],
    },
  },
  { timestamps: true }
);

LeadSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    // Derive primary phone from first available phone field
    ret.phone = ret.workDirectPhone || ret.mobilePhone || ret.homePhone || ret.corporatePhone || ret.companyPhone || ret.otherPhone || '';
    if (ret.activities) {
      ret.activities = ret.activities.map((a: any) => ({
        ...a,
        id: a._id?.toString(),
        timestamp: a.timestamp?.toISOString?.()?.split('T')[0] || a.timestamp,
      }));
    }
    if (ret.date) ret.date = ret.date.toISOString().split('T')[0];
    if (ret.nextFollowUp) ret.nextFollowUp = ret.nextFollowUp.toISOString().split('T')[0];
    if (ret.lastActivity) ret.lastActivity = ret.lastActivity.toISOString().split('T')[0];
    if (ret.closedAt) ret.closedAt = ret.closedAt.toISOString().split('T')[0];
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<ILead>('Lead', LeadSchema);
