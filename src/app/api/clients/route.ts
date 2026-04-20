import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { getUserFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser || authUser.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const clients = await User.find({ role: 'client' })
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: clients, total: clients.length });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser || authUser.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { name, email, password, company } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
    }

    const client = await User.create({ name, email, password, role: 'client', company });

    await ActivityLog.create({
      userId: authUser.userId,
      action: `Created client account for ${name}`,
      entityType: 'client',
      entityId: client._id,
      details: `Email: ${email}`,
    });

    return NextResponse.json(
      { success: true, data: { ...client.toJSON(), password: undefined } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
