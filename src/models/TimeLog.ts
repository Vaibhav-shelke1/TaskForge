import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeLogDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  developerId: mongoose.Types.ObjectId;
  hours: number;
  note: string;
  date: Date;
  isRunning: boolean;
  startTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimeLogSchema = new Schema<ITimeLogDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    developerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hours: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, default: '' },
    date: { type: Date, default: () => new Date() },
    isRunning: { type: Boolean, default: false },
    startTime: { type: Date },
  },
  { timestamps: true }
);

TimeLogSchema.index({ taskId: 1 });
TimeLogSchema.index({ developerId: 1, date: -1 });

async function recalcTaskHours(taskId: mongoose.Types.ObjectId | string) {
  const TimeLogModel = mongoose.model('TimeLog');
  const TaskModel = mongoose.model('Task');
  const agg = await TimeLogModel.aggregate([
    { $match: { taskId: new mongoose.Types.ObjectId(taskId.toString()) } },
    { $group: { _id: '$taskId', total: { $sum: '$hours' } } },
  ]);
  const total = agg[0]?.total ?? 0;
  await TaskModel.findByIdAndUpdate(taskId, { totalLoggedHours: total });
}

TimeLogSchema.post('save', async function () {
  await recalcTaskHours(this.taskId);
});

TimeLogSchema.post('findOneAndDelete', async function (doc: ITimeLogDocument | null) {
  if (doc) await recalcTaskHours(doc.taskId);
});

TimeLogSchema.post('deleteMany', async function () {
  // Bulk recalc handled manually in service layer
});

export const TimeLog =
  (mongoose.models.TimeLog as mongoose.Model<ITimeLogDocument>) ||
  mongoose.model<ITimeLogDocument>('TimeLog', TimeLogSchema);
