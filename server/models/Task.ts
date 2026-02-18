import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo: string;   // agent name
  createdBy: string;    // agent name
  leadId?: string;      // optional link to a lead
  leadName?: string;    // denormalized for display
  category: 'follow-up' | 'call' | 'meeting' | 'email' | 'research' | 'admin' | 'other';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['todo', 'in-progress', 'completed', 'cancelled'], default: 'todo' },
    assignedTo: { type: String, required: true },
    createdBy: { type: String, required: true },
    leadId: { type: String, default: null },
    leadName: { type: String, default: '' },
    category: { type: String, enum: ['follow-up', 'call', 'meeting', 'email', 'research', 'admin', 'other'], default: 'other' },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
