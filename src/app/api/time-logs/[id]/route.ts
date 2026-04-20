import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TimeLog } from '@/models/TimeLog';
import { getUserFromHeaders } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser || authUser.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const log = await TimeLog.findById(params.id);
    if (!log) {
      return NextResponse.json({ success: false, error: 'Time log not found' }, { status: 404 });
    }

    if (log.developerId.toString() !== authUser.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { hours, note, date } = await request.json();
    Object.assign(log, {
      hours: hours ?? log.hours,
      note: note ?? log.note,
      date: date ? new Date(date) : log.date,
    });

    await log.save();
    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error('Update time log error:', error);
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
    const log = await TimeLog.findById(params.id);
    if (!log) {
      return NextResponse.json({ success: false, error: 'Time log not found' }, { status: 404 });
    }

    if (log.developerId.toString() !== authUser.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await log.deleteOne();
    return NextResponse.json({ success: true, message: 'Time log deleted' });
  } catch (error) {
    console.error('Delete time log error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
