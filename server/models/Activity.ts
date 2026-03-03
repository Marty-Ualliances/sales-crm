import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType =
    | 'call'
    | 'email'
    | 'note'
    | 'meeting'
    | 'task'
    | 'stage_change'
    | 'assignment'
    | 'status_change'
    | 'upload'
    | 'follow_up';

export type CallOutcome =
    | 'connected'
    | 'voicemail'
    | 'no_answer'
    | 'busy'
    | 'wrong_number'
    | 'callback_scheduled';

export interface IActivity extends Document {
    leadId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: ActivityType;
    callDuration: number;
    callOutcome: CallOutcome | null;
    fromStage: string;
    toStage: string;
    fromStatus: string;
    toStatus: string;
    subject: string;
    description: string;
    scheduledAt: Date | null;
    completedAt: Date | null;
    isCompleted: boolean;
    metadata: Record<string, unknown>;
}

const ActivitySchema = new Schema<IActivity>(
    {
        leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: [
                'call', 'email', 'note', 'meeting', 'task',
                'stage_change', 'assignment', 'status_change', 'upload', 'follow_up',
            ],
            required: true,
        },
        callDuration: { type: Number, default: 0 },
        callOutcome: {
            type: String,
            enum: ['connected', 'voicemail', 'no_answer', 'busy', 'wrong_number', 'callback_scheduled'],
            default: null,
        },
        fromStage: { type: String, default: '' },
        toStage: { type: String, default: '' },
        fromStatus: { type: String, default: '' },
        toStatus: { type: String, default: '' },
        subject: { type: String, default: '' },
        description: { type: String, default: '' },
        scheduledAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        isCompleted: { type: Boolean, default: false },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

// ── Compound indexes for efficient querying ──
ActivitySchema.index({ leadId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, type: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });

ActivitySchema.set('toJSON', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model<IActivity>('Activity', ActivitySchema);
