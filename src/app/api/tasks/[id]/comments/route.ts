import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Task } from '@/models/Task';
import { Comment } from '@/models/Comment';
import { ActivityLog } from '@/models/ActivityLog';
import { getUserFromHeaders } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (authUser.role === 'client' && task.clientId.toString() !== authUser.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Comment content is required' }, { status: 400 });
    }

    const comment = await Comment.create({
      taskId: params.id,
      userId: authUser.userId,
      content: content.trim(),
    });

    await ActivityLog.create({
      userId: authUser.userId,
      action: `Added comment on task "${task.title}"`,
      entityType: 'comment',
      entityId: comment._id,
    });

    const populated = await comment.populate('userId', 'name email role');
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
