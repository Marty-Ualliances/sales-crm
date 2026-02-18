import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'follow-up' | 'overdue' | 'assignment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  leadId?: string;
  userId?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: { type: String, enum: ['follow-up', 'overdue', 'assignment', 'system'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    leadId: { type: String },
    userId: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.timestamp) ret.timestamp = ret.timestamp.toISOString().split('T')[0];
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
