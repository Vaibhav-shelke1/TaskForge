import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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
    const limit = parseInt(searchParams.get('limit') ?? '20');

    const logs = await ActivityLog.find({ userId: authUser.userId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Activity error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
