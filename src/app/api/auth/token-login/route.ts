import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { token } = await request.json();

    if (!token?.trim()) {
      return NextResponse.json({ success: false, error: 'Access token is required' }, { status: 400 });
    }

    const client = await User.findOne({ clientToken: token.trim(), role: 'client' });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Invalid access token' }, { status: 401 });
    }

    if (!client.clientTokenActive) {
      return NextResponse.json(
        { success: false, error: 'This access token has been expired. Contact your developer.' },
        { status: 403 }
      );
    }

    const jwt = await signToken({
      userId: client._id.toString(),
      role: client.role,
      email: client.email,
      name: client.name,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          _id: client._id,
          name: client.name,
          email: client.email,
          role: client.role,
          company: client.company,
        },
      },
    });

    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days for token-based access
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token login error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
