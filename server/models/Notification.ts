import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'assignment' | 'stage_change' | 'mention' | 'reminder' | 'system';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link: string;
  isRead: boolean;
  readAt: Date | null;
  relatedLead: mongoose.Types.ObjectId | null;
  relatedActivity: mongoose.Types.ObjectId | null;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['assignment', 'stage_change', 'mention', 'reminder', 'system'],
      default: 'system',
    },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    relatedLead: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    relatedActivity: { type: Schema.Types.ObjectId, ref: 'Activity', default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

NotificationSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
