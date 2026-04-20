import mongoose, { Document, Schema } from 'mongoose';

export interface ILinkDoc {
  title: string;
  url: string;
}

export interface ITaskDocument extends Document {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  budgetHours: number;
  estimatedHours?: number;
  clientId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  source: 'client' | 'call' | 'slack' | 'internal';
  isBillable: boolean;
  links: ILinkDoc[];
  attachments: string[];
  totalLoggedHours: number;
  paymentStatus: 'pending' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILinkDoc>({ title: String, url: String }, { _id: false });

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    budgetHours: { type: Number, required: true, default: 0, min: 0 },
    estimatedHours: { type: Number, min: 0 },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['client', 'call', 'slack', 'internal'], default: 'internal' },
    isBillable: { type: Boolean, default: true },
    links: [LinkSchema],
    attachments: [{ type: String }],
    totalLoggedHours: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  },
  { timestamps: true }
);

TaskSchema.index({ clientId: 1, status: 1 });
TaskSchema.index({ createdBy: 1 });

export const Task =
  (mongoose.models.Task as mongoose.Model<ITaskDocument>) ||
  mongoose.model<ITaskDocument>('Task', TaskSchema);
