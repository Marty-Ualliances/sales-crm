import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity {
  type: 'call' | 'follow-up' | 'note' | 'status-change';
  description: string;
  timestamp: Date;
  agent: string;
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
  city: string;
  state: string;
  status: 'New' | 'Contacted' | 'Follow-up' | 'Closed' | 'Lost' | 'Reshedule' | 'No Show';
  assignedAgent: string;
  notes: string;
  nextFollowUp: Date | null;
  callCount: number;
  lastActivity: Date;
  revenue: number;
  activities: IActivity[];
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: { type: String, enum: ['call', 'follow-up', 'note', 'status-change'], required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, required: true },
    agent: { type: String, required: true },
  },
  { _id: true }
);

const LeadSchema = new Schema<ILead>(
  {
    date: { type: Date, default: Date.now },
    source: { type: String, enum: ['CSV Import', 'Manual', 'Website', 'Referral', 'LinkedIn', 'Other'], default: 'Manual' },
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
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    status: { type: String, enum: ['New', 'Contacted', 'Follow-up', 'Closed', 'Lost', 'Reshedule', 'No Show'], default: 'New' },
    assignedAgent: { type: String, required: true },
    notes: { type: String, default: '' },
    nextFollowUp: { type: Date, default: null },
    callCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    revenue: { type: Number, default: 0 },
    activities: [ActivitySchema],
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
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<ILead>('Lead', LeadSchema);
