import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  leadId: string;
  leadName: string;
  agentName: string;
  date: Date;
  time: string;
  duration: string;
  status: 'Completed' | 'Missed' | 'Follow-up';
  notes: string;
  hasRecording: boolean;
}

const CallSchema = new Schema<ICall>(
  {
    leadId: { type: String, required: true },
    leadName: { type: String, required: true },
    agentName: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: String, default: '0 min' },
    status: { type: String, enum: ['Completed', 'Missed', 'Follow-up'], default: 'Completed' },
    notes: { type: String, default: '' },
    hasRecording: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CallSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    if (ret.date) ret.date = ret.date.toISOString().split('T')[0];
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<ICall>('Call', CallSchema);
