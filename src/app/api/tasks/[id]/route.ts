import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Task } from '@/models/Task';
import { TimeLog } from '@/models/TimeLog';
import { Comment } from '@/models/Comment';
import { ActivityLog } from '@/models/ActivityLog';
import { getUserFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const task = await Task.findById(params.id)
      .populate('clientId', 'name email company')
      .populate('createdBy', 'name email');

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // clientId is populated (User document) — extract _id for the ownership check
    const taskClientId =
      task.clientId && typeof task.clientId === 'object' && '_id' in (task.clientId as object)
        ? (task.clientId as { _id: { toString(): string } })._id.toString()
        : String(task.clientId);

    if (authUser.role === 'client' && taskClientId !== authUser.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const [timeLogs, comments] = await Promise.all([
      TimeLog.find({ taskId: params.id })
        .populate('developerId', 'name email')
        .sort({ date: -1 }),
      Comment.find({ taskId: params.id })
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 }),
    ]);

    return NextResponse.json({ success: true, data: { task, timeLogs, comments } });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const task = await Task.findById(params.id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // clientId is NOT populated here — it's a raw ObjectId
    if (authUser.role === 'client' && task.clientId.toString() !== authUser.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Clients can only update title, description, and status
    if (authUser.role === 'client') {
      const { title, description, status } = body;
      Object.assign(task, { title, description, status });
    } else {
      const {
        title, description, priority, status, budgetHours,
        estimatedHours, source, isBillable, links, dueDate,
      } = body;
      Object.assign(task, {
        title, description, priority, status, budgetHours,
        estimatedHours, source, isBillable, links,
        dueDate: dueDate || undefined,
      });
    }

    await task.save();

    await ActivityLog.create({
      userId: authUser.userId,
      action: `Updated task "${task.title}"`,
      entityType: 'task',
      entityId: task._id,
      details: `Status: ${task.status}`,
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser || authUser.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const task = await Task.findByIdAndDelete(params.id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    await Promise.all([
      TimeLog.deleteMany({ taskId: params.id }),
      Comment.deleteMany({ taskId: params.id }),
    ]);

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
