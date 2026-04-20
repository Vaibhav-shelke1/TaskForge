import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken, COOKIE_NAME, getUserFromHeaders } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { name, email, password, company } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Check if a developer is creating a client account
    const authUser = getUserFromHeaders(request);
    const userCount = await User.countDocuments();

    let role: 'developer' | 'client' = 'client';
    if (userCount === 0) {
      // First user becomes the developer
      role = 'developer';
    } else if (authUser?.role === 'developer') {
      // Developer can create client accounts
      role = 'client';
    } else if (userCount > 0 && !authUser) {
      // Public registration after first user: not allowed
      return NextResponse.json(
        { success: false, error: 'Registration is restricted. Contact your developer.' },
        { status: 403 }
      );
    }

    const user = await User.create({ name, email, password, role, company });

    const token = await signToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company,
          },
        },
      },
      { status: 201 }
    );

    // Only set cookie if it's first-time setup (not developer creating a client)
    if (!authUser) {
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
