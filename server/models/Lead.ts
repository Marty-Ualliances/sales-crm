import mongoose, { Schema, Document } from 'mongoose';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type LeadSource = 'csv_upload' | 'manual' | 'website' | 'referral' | 'linkedin' | 'other';

export interface ILead extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  source: LeadSource;
  uploadedBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId | null;
  assignedAt: Date | null;
  status: LeadStatus;
  pipelineStage: mongoose.Types.ObjectId;
  dealValue: number;
  expectedCloseDate: Date | null;
  lostReason: string;
  wonDate: Date | null;
  tags: string[];
  customFields: Record<string, unknown>;
  notes: string;
  // Soft delete
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: mongoose.Types.ObjectId | null;
  // Legacy fields kept for backward compatibility
  address: string;
  city: string;
  state: string;
  website: string;
  personLinkedinUrl: string;
  companyLinkedinUrl: string;
  workDirectPhone: string;
  mobilePhone: string;
  homePhone: string;
  corporatePhone: string;
  companyPhone: string;
  otherPhone: string;
  employeeCount: number | null;
  employees: Array<{
    name: string;
    email: string;
    linkedin?: string;
    isDecisionMaker: boolean;
    leftOrganization: boolean;
    phones: Array<{
      type: 'office' | 'direct' | 'home' | 'corporate' | 'company';
      number: string;
      extension?: string;
    }>;
  }>;
  priority: 'A' | 'B' | 'C';
  segment: string;
  revenue: number;
  // Virtuals
  fullName: string;
}

const LeadSchema = new Schema<ILead>(
  {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, default: '', index: { sparse: true } },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    source: {
      type: String,
      enum: ['csv_upload', 'manual', 'website', 'referral', 'linkedin', 'other'],
      default: 'manual',
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'new',
    },
    pipelineStage: { type: Schema.Types.ObjectId, ref: 'PipelineStage', default: null },
    dealValue: { type: Number, default: 0 },
    expectedCloseDate: { type: Date, default: null },
    lostReason: { type: String, default: '' },
    wonDate: { type: Date, default: null },
    tags: [{ type: String }],
    customFields: { type: Schema.Types.Mixed, default: {} },
    notes: { type: String, default: '' },
    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Legacy / additional contact fields
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    website: { type: String, default: '' },
    personLinkedinUrl: { type: String, default: '' },
    companyLinkedinUrl: { type: String, default: '' },
    workDirectPhone: { type: String, default: '' },
    mobilePhone: { type: String, default: '' },
    homePhone: { type: String, default: '' },
    corporatePhone: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    otherPhone: { type: String, default: '' },
    employeeCount: { type: Number, default: null },
    employees: [
      {
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        linkedin: { type: String },
        isDecisionMaker: { type: Boolean, default: false },
        leftOrganization: { type: Boolean, default: false },
        phones: [
          {
            type: {
              type: String,
              enum: ['office', 'direct', 'home', 'corporate', 'company'],
              default: 'direct',
            },
            number: { type: String, default: '' },
            extension: { type: String },
          },
        ],
      },
    ],
    priority: { type: String, enum: ['A', 'B', 'C'], default: 'C' },
    segment: { type: String, default: '' },
    revenue: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// ── Indexes tailored to query patterns ──
LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ pipelineStage: 1, isDeleted: 1 });
LeadSchema.index({ uploadedBy: 1, createdAt: -1 });
LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ isDeleted: 1, createdAt: -1 });
// Text index for search queries
LeadSchema.index({ firstName: 'text', lastName: 'text', email: 'text', company: 'text' });

// ── Virtual: fullName ──
LeadSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// ── Pre-find hooks: exclude soft-deleted by default ──
function excludeDeleted(this: mongoose.Query<unknown, unknown>) {
  const filter = this.getFilter();
  // Only add isDeleted filter if not explicitly querying for deleted
  if (filter.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
}

LeadSchema.pre('find', excludeDeleted);
LeadSchema.pre('findOne', excludeDeleted);
LeadSchema.pre('findOneAndUpdate', excludeDeleted);
LeadSchema.pre('countDocuments', excludeDeleted);

// ── JSON transform ──
LeadSchema.set('toJSON', {
  virtuals: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    // Derive primary phone from first available phone field
    if (!ret.phone) {
      ret.phone = ret.workDirectPhone || ret.mobilePhone || ret.homePhone
        || ret.corporatePhone || ret.companyPhone || ret.otherPhone || '';
    }
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<ILead>('Lead', LeadSchema);
