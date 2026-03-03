import mongoose, { Schema, Document } from 'mongoose';

export interface IPipelineStage extends Document {
    name: string;
    order: number;
    color: string;
    probability: number;
    description: string;
    isDefault: boolean;
    isActive: boolean;
}

const PipelineStageSchema = new Schema<IPipelineStage>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        order: { type: Number, required: true },
        color: { type: String, default: '#6B7280' },
        probability: { type: Number, min: 0, max: 100, default: 0 },
        description: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

PipelineStageSchema.index({ order: 1 });

PipelineStageSchema.set('toJSON', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model<IPipelineStage>('PipelineStage', PipelineStageSchema);
