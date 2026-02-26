import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
    title: string;
    description: string;
    date: Date;
    time: string;
    duration: number; // in minutes
    leadId: mongoose.Types.ObjectId | null;
    leadName: string;
    createdBy: string; // userId
    createdByName: string;
    attendees: string[];
    status: 'scheduled' | 'completed' | 'cancelled';
    agenda: string;
    confirmationSent: boolean;
    nextStep: string;
    outcome: string;
    ams?: string;
    driveLink?: string;
}

const MeetingSchema = new Schema<IMeeting>(
    {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        duration: { type: Number, default: 30 },
        leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
        leadName: { type: String, default: '' },
        createdBy: { type: String, required: true },
        createdByName: { type: String, default: '' },
        attendees: [{ type: String }],
        status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
        agenda: { type: String, default: '' },
        confirmationSent: { type: Boolean, default: false },
        nextStep: { type: String, default: '' },
        outcome: { type: String, default: '' },
        ams: { type: String, default: '' },
        driveLink: { type: String, default: '' },
    },
    { timestamps: true }
);

MeetingSchema.set('toJSON', {
    transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        if (ret.date) ret.date = ret.date.toISOString().split('T')[0];
        if (ret.leadId) ret.leadId = ret.leadId.toString();
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
