import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { getUserFromHeaders } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const authUser = getUserFromHeaders(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, company, bio, linkedin, github, website, paypalEmail, phone } = body;

    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (name) user.name = name.trim();
    if (company !== undefined) user.company = company?.trim() || undefined;
    if (bio !== undefined) user.bio = bio?.trim() || undefined;
    if (linkedin !== undefined) user.linkedin = linkedin?.trim() || undefined;
    if (github !== undefined) user.github = github?.trim() || undefined;
    if (website !== undefined) user.website = website?.trim() || undefined;
    if (paypalEmail !== undefined) user.paypalEmail = paypalEmail?.trim() || undefined;
    if (phone !== undefined) user.phone = phone?.trim() || undefined;

    await user.save();

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
