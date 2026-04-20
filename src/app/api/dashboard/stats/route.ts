import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Task } from '@/models/Task';
import { TimeLog } from '@/models/TimeLog';
import { User } from '@/models/User';
import { getUserFromHeaders } from '@/lib/auth';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isDeveloper = authUser.role === 'developer';
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const userObjId = new mongoose.Types.ObjectId(authUser.userId);

    if (isDeveloper) {
      const [hoursAgg, weekAgg, taskAgg, clientCount] = await Promise.all([
        // All-time hours + billable breakdown via task join
        TimeLog.aggregate([
          { $match: { developerId: userObjId } },
          {
            $lookup: {
              from: 'tasks',
              localField: 'taskId',
              foreignField: '_id',
              as: 'task',
            },
          },
          { $unwind: { path: '$task', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              total: { $sum: '$hours' },
              billable: {
                $sum: { $cond: [{ $eq: ['$task.isBillable', true] }, '$hours', 0] },
              },
            },
          },
        ]),
        // This-week hours
        TimeLog.aggregate([
          { $match: { developerId: userObjId, date: { $gte: weekStart, $lte: weekEnd } } },
          { $group: { _id: null, total: { $sum: '$hours' } } },
        ]),
        // Task stats grouped by status
        Task.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              overBudget: {
                $sum: { $cond: [{ $gt: ['$totalLoggedHours', '$budgetHours'] }, 1, 0] },
              },
            },
          },
        ]),
        User.countDocuments({ role: 'client' }),
      ]);

      const totals = hoursAgg[0] ?? { total: 0, billable: 0 };
      const weekTotal = weekAgg[0]?.total ?? 0;

      const tasksByStatus = { todo: 0, inProgress: 0, done: 0 };
      let totalTasks = 0;
      let overBudgetTasks = 0;
      for (const row of taskAgg) {
        const cnt = row.count as number;
        totalTasks += cnt;
        overBudgetTasks += row.overBudget as number;
        if (row._id === 'todo') tasksByStatus.todo = cnt;
        else if (row._id === 'in-progress') tasksByStatus.inProgress = cnt;
        else if (row._id === 'done') tasksByStatus.done = cnt;
      }

      return NextResponse.json({
        success: true,
        data: {
          totalClients: clientCount,
          totalTasks,
          totalHoursThisWeek: weekTotal,
          totalHoursAllTime: totals.total,
          billableHours: totals.billable,
          nonBillableHours: totals.total - totals.billable,
          overBudgetTasks,
          tasksByStatus,
        },
      });
    } else {
      // Client path
      const clientObjId = new mongoose.Types.ObjectId(authUser.userId);
      const clientTasks = await Task.find({ clientId: clientObjId })
        .select('_id status budgetHours totalLoggedHours isBillable paymentStatus')
        .lean();

      const taskIds = clientTasks.map((t) => t._id);

      const [weekAgg, allAgg] = await Promise.all([
        TimeLog.aggregate([
          { $match: { taskId: { $in: taskIds }, date: { $gte: weekStart, $lte: weekEnd } } },
          { $group: { _id: null, total: { $sum: '$hours' } } },
        ]),
        TimeLog.aggregate([
          { $match: { taskId: { $in: taskIds } } },
          { $group: { _id: null, total: { $sum: '$hours' } } },
        ]),
      ]);

      const tasksByStatus = { todo: 0, inProgress: 0, done: 0 };
      let overBudgetTasks = 0;
      for (const t of clientTasks) {
        if (t.status === 'todo') tasksByStatus.todo++;
        else if (t.status === 'in-progress') tasksByStatus.inProgress++;
        else if (t.status === 'done') tasksByStatus.done++;
        if (t.totalLoggedHours > t.budgetHours) overBudgetTasks++;
      }

      const totalHours = allAgg[0]?.total ?? 0;
      const billableHours = clientTasks
        .filter((t) => t.isBillable)
        .reduce((s, t) => s + t.totalLoggedHours, 0);

      return NextResponse.json({
        success: true,
        data: {
          totalTasks: clientTasks.length,
          totalHoursThisWeek: weekAgg[0]?.total ?? 0,
          totalHoursAllTime: totalHours,
          billableHours,
          nonBillableHours: totalHours - billableHours,
          overBudgetTasks,
          tasksByStatus,
        },
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
