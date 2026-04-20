import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Task } from '@/models/Task';
import { ActivityLog } from '@/models/ActivityLog';
import { getUserFromHeaders } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { paymentStatus } = await request.json();

    if (!['pending', 'paid'].includes(paymentStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid payment status' }, { status: 400 });
    }

    const task = await Task.findById(params.id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Client can only update their own tasks' payment
    if (authUser.role === 'client' && task.clientId.toString() !== authUser.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    task.paymentStatus = paymentStatus;
    await task.save();

    await ActivityLog.create({
      userId: authUser.userId,
      action: `Marked payment as ${paymentStatus} for task "${task.title}"`,
      entityType: 'task',
      entityId: task._id,
    });

    return NextResponse.json({ success: true, data: { paymentStatus } });
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
