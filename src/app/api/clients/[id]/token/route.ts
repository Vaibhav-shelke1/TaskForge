import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { getUserFromHeaders } from '@/lib/auth';

function generateClientToken(): string {
  return 'tf_' + crypto.randomBytes(24).toString('hex');
}

/** POST — generate / regenerate a client access token */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser || authUser.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const client = await User.findOne({ _id: params.id, role: 'client' });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const token = generateClientToken();
    client.clientToken = token;
    client.clientTokenActive = true;
    client.clientTokenGeneratedAt = new Date();
    await client.save();

    await ActivityLog.create({
      userId: authUser.userId,
      action: `Generated access token for client "${client.name}"`,
      entityType: 'client',
      entityId: client._id,
    });

    return NextResponse.json({
      success: true,
      data: {
        clientToken: token,
        clientTokenActive: true,
        clientTokenGeneratedAt: client.clientTokenGeneratedAt,
      },
      message: 'Access token generated. Share it with the client to let them log in.',
    });
  } catch (error) {
    console.error('Generate token error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

/** PATCH — toggle token active/inactive (expire or reactivate) */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser || authUser.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { active } = await request.json();

    const client = await User.findOne({ _id: params.id, role: 'client' });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    if (!client.clientToken) {
      return NextResponse.json({ success: false, error: 'No token exists. Generate one first.' }, { status: 400 });
    }

    client.clientTokenActive = active;
    await client.save();

    await ActivityLog.create({
      userId: authUser.userId,
      action: `${active ? 'Activated' : 'Expired'} access token for client "${client.name}"`,
      entityType: 'client',
      entityId: client._id,
    });

    return NextResponse.json({
      success: true,
      data: { clientTokenActive: active },
      message: active ? 'Token reactivated.' : 'Token expired. Client can no longer log in with it.',
    });
  } catch (error) {
    console.error('Toggle token error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
