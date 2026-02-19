import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

NoteSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<INote>('Note', NoteSchema);
