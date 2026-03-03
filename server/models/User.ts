import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'lead_gen' | 'sdr' | 'closer' | 'manager' | 'hr';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: UserRole;
  team: mongoose.Types.ObjectId;
  isActive: boolean;
  phone: string;
  refreshTokens: string[];
  failedLoginAttempts: number;
  lockUntil?: Date;
  /** Token version — incremented on password change to invalidate all existing JWTs */
  tokenVersion: number;
  /** SHA-256 hash of the password-reset token (never store plaintext) */
  resetTokenHash?: string;
  resetTokenExpiry?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['admin', 'lead_gen', 'sdr', 'closer', 'manager', 'hr'],
      default: 'sdr',
    },
    team: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    isActive: { type: Boolean, default: true },
    phone: { type: String, default: '' },
    refreshTokens: [{ type: String }],
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: undefined },
    tokenVersion: { type: Number, default: 0 },
    resetTokenHash: { type: String, default: undefined },
    resetTokenExpiry: { type: Date, default: undefined },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  // Increment tokenVersion to invalidate all existing JWTs
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret.password;
    delete ret.resetTokenHash;
    delete ret.resetTokenExpiry;
    delete ret.refreshTokens;
    delete ret.failedLoginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
