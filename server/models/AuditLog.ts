import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  userId?: string;     // new required field, optional for backwards compat
  adminId?: string;    // kept for backwards compat
  adminEmail?: string;
  entityType?: string; // added
  entityId?: string;   // added
  targetId?: string;
  targetEmail?: string;
  targetRole?: string;
  ip?: string;
  timestamp: Date;
  oldValue?: Record<string, any>; // added
  newValue?: Record<string, any>; // added
  meta?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    adminId: { type: String, index: true },
    adminEmail: { type: String },
    entityType: { type: String, index: true },
    entityId: { type: String, index: true },
    targetId: { type: String },
    targetEmail: { type: String },
    targetRole: { type: String },
    ip: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: false }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
