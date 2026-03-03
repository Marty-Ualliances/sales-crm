import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
    name: string;
    manager: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    description: string;
}

const TeamSchema = new Schema<ITeam>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        manager: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        description: { type: String, default: '' },
    },
    { timestamps: true }
);

TeamSchema.set('toJSON', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model<ITeam>('Team', TeamSchema);
