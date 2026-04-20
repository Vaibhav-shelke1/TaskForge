import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TimeLog } from '@/models/TimeLog';
import { Task } from '@/models/Task';
import { User } from '@/models/User';
import { getUserFromHeaders } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const clientId = searchParams.get('clientId');

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: 'Date range (from/to) is required' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Determine which client(s) to report on
    let effectiveClientId: string | null = null;
    if (authUser.role === 'client') {
      effectiveClientId = authUser.userId;
    } else if (clientId) {
      effectiveClientId = clientId;
    }

    // Get all time logs in range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logQuery: Record<string, any> = {
      date: { $gte: fromDate, $lte: toDate },
    };

    if (authUser.role === 'developer') {
      logQuery.developerId = authUser.userId;
    }

    const rawLogs = await TimeLog.find(logQuery)
      .populate({
        path: 'taskId',
        populate: { path: 'clientId', select: 'name email company' },
      })
      .populate('developerId', 'name email')
      .sort({ date: 1 });

    // Filter by client if needed
    const logs = effectiveClientId
      ? rawLogs.filter((log) => {
          const task = log.taskId as unknown as { clientId: { _id: mongoose.Types.ObjectId } };
          return task?.clientId?._id?.toString() === effectiveClientId;
        })
      : rawLogs;

    // Group logs by task
    const taskMap = new Map<
      string,
      { task: unknown; logs: unknown[]; totalHours: number }
    >();

    for (const log of logs) {
      const task = log.taskId as unknown as { _id: mongoose.Types.ObjectId; title: string; isBillable: boolean };
      if (!task?._id) continue;
      const taskId = task._id.toString();
      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, { task, logs: [], totalHours: 0 });
      }
      const entry = taskMap.get(taskId)!;
      entry.logs.push(log);
      entry.totalHours += log.hours;
    }

    const tasks = Array.from(taskMap.values());

    const totalHours = tasks.reduce((sum, t) => sum + t.totalHours, 0);
    const billableHours = tasks
      .filter((t) => (t.task as { isBillable: boolean }).isBillable)
      .reduce((sum, t) => sum + t.totalHours, 0);

    // Get developer and client info
    const developer = await User.findOne({ role: 'developer' }).select('name email');
    const client = effectiveClientId
      ? await User.findById(effectiveClientId).select('name email company')
      : null;

    return NextResponse.json({
      success: true,
      data: {
        client,
        developer,
        dateRange: { from, to },
        tasks,
        summary: {
          totalHours,
          totalTasks: tasks.length,
          billableHours,
          nonBillableHours: totalHours - billableHours,
        },
      },
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
