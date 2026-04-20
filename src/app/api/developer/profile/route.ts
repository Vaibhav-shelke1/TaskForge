import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { getUserFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Return the developer's public profile (first developer in the system)
    const developer = await User.findOne({ role: 'developer' }).select(
      'name email company bio linkedin github website paypalEmail phone'
    );

    if (!developer) {
      return NextResponse.json({ success: false, error: 'Developer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: developer });
  } catch (error) {
    console.error('Developer profile error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
