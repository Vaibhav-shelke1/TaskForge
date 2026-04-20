import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: 'developer' | 'client';
  company?: string;
  avatar?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  paypalEmail?: string;
  phone?: string;
  clientToken?: string;
  clientTokenActive?: boolean;
  clientTokenGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['developer', 'client'], default: 'client' },
    company: { type: String, trim: true },
    avatar: { type: String },
    bio: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    website: { type: String, trim: true },
    paypalEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    clientToken: { type: String, unique: true, sparse: true },
    clientTokenActive: { type: Boolean, default: false },
    clientTokenGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.password;
    return ret;
  },
});

export const User =
  (mongoose.models.User as mongoose.Model<IUserDocument>) ||
  mongoose.model<IUserDocument>('User', UserSchema);
