import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');
    const search = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (authUser.role === 'client') {
      query.clientId = authUser.userId;
    } else if (clientId) {
      query.clientId = clientId;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;
    if (search) query.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(query)
      .populate('clientId', 'name email company')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tasks, total: tasks.length });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const {
      title, description, priority, status, budgetHours,
      estimatedHours, clientId, source, isBillable, links,
    } = body;

    if (!title || !clientId || budgetHours === undefined) {
      return NextResponse.json(
        { success: false, error: 'Title, clientId and budgetHours are required' },
        { status: 400 }
      );
    }

    // Clients can only create tasks for themselves
    const effectiveClientId = authUser.role === 'client' ? authUser.userId : clientId;

    const task = await Task.create({
      title, description, priority, status, budgetHours, estimatedHours,
      clientId: effectiveClientId, createdBy: authUser.userId, source, isBillable, links,
    });

    await ActivityLog.create({
      userId: authUser.userId,
      action: `Created task "${title}"`,
      entityType: 'task',
      entityId: task._id,
    });

    const populated = await task.populate([
      { path: 'clientId', select: 'name email company' },
      { path: 'createdBy', select: 'name email' },
    ]);

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
