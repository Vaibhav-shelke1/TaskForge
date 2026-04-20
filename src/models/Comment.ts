import mongoose, { Document, Schema } from 'mongoose';

export interface ICommentDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ICommentDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

CommentSchema.index({ taskId: 1, createdAt: -1 });

export const Comment =
  (mongoose.models.Comment as mongoose.Model<ICommentDocument>) ||
  mongoose.model<ICommentDocument>('Comment', CommentSchema);
