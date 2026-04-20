import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Task } from '@/models/Task';
import { getUserFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'client' && authUser.userId !== params.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const client = await User.findById(params.id).select('-password');
    if (!client || client.role !== 'client') {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const taskStats = await Task.aggregate([
      { $match: { clientId: client._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budgetHours' },
          totalLogged: { $sum: '$totalLoggedHours' },
        },
      },
    ]);

    return NextResponse.json({ success: true, data: { client, taskStats } });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser || authUser.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, company } = body;

    const client = await User.findByIdAndUpdate(
      params.id,
      { name, company },
      { new: true }
    ).select('-password');

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error('Update client error:', error);
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
    const client = await User.findByIdAndDelete(params.id);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
