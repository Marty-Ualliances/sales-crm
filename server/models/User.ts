import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: 'admin' | 'sdr' | 'hr' | 'leadgen';
  leadsAssigned: number;
  callsMade: number;
  followUpsCompleted: number;
  followUpsPending: number;
  conversionRate: number;
  revenueClosed: number;
  resetToken?: string;
  resetTokenExpiry?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String, required: true },
    role: { type: String, enum: ['admin', 'sdr', 'hr', 'leadgen'], default: 'sdr' },
    leadsAssigned: { type: Number, default: 0 },
    callsMade: { type: Number, default: 0 },
    followUpsCompleted: { type: Number, default: 0 },
    followUpsPending: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    revenueClosed: { type: Number, default: 0 },
    resetToken: { type: String, default: undefined },
    resetTokenExpiry: { type: Date, default: undefined },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
