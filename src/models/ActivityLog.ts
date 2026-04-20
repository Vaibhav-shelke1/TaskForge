import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  entityType: 'task' | 'timeLog' | 'client' | 'comment';
  entityId: mongoose.Types.ObjectId;
  details?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['task', 'timeLog', 'client', 'comment'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    details: { type: String },
  },
  { timestamps: true, versionKey: false }
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog =
  (mongoose.models.ActivityLog as mongoose.Model<IActivityLogDocument>) ||
  mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);
