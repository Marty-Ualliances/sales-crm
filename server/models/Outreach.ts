import mongoose, { Schema, Document } from 'mongoose';

export interface IOutreach extends Document {
    agentName: string;
    date: string;
    emailsSent: number;
}

const OutreachSchema = new Schema<IOutreach>(
    {
        agentName: { type: String, required: true },
        date: { type: String, required: true }, // Store as YYYY-MM-DD for easy querying
        emailsSent: { type: Number, default: 0 },
    },
    { timestamps: true }
);

OutreachSchema.index({ agentName: 1, date: 1 }, { unique: true });

OutreachSchema.set('toJSON', {
    transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model<IOutreach>('Outreach', OutreachSchema);
