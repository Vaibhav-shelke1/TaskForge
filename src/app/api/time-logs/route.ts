import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TimeLog } from '@/models/TimeLog';
import { Task } from '@/models/Task';
import { ActivityLog } from '@/models/ActivityLog';
import { getUserFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') ?? '50');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (authUser.role === 'developer') {
      query.developerId = authUser.userId;
    } else {
      // Client: get time logs for their tasks
      const clientTasks = await Task.find({ clientId: authUser.userId }).select('_id');
      query.taskId = { $in: clientTasks.map((t) => t._id) };
    }

    if (taskId) query.taskId = taskId;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    const logs = await TimeLog.find(query)
      .populate('taskId', 'title clientId isBillable budgetHours totalLoggedHours')
      .populate('developerId', 'name email')
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: logs, total: logs.length });
  } catch (error) {
    console.error('Get time logs error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser || authUser.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Only developers can log time' }, { status: 403 });
    }

    await connectDB();
    const { taskId, hours, note, date } = await request.json();

    if (!taskId || hours === undefined || hours < 0) {
      return NextResponse.json(
        { success: false, error: 'taskId and valid hours are required' },
        { status: 400 }
      );
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const log = await TimeLog.create({
      taskId,
      developerId: authUser.userId,
      hours: Number(hours),
      note: note ?? '',
      date: date ? new Date(date) : new Date(),
    });

    await ActivityLog.create({
      userId: authUser.userId,
      action: `Logged ${hours}h on "${task.title}"`,
      entityType: 'timeLog',
      entityId: log._id,
      details: note,
    });

    const populated = await log.populate([
      { path: 'taskId', select: 'title clientId isBillable budgetHours totalLoggedHours' },
      { path: 'developerId', select: 'name email' },
    ]);

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    console.error('Create time log error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
