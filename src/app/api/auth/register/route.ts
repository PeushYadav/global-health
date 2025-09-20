// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/bcrypt';
import { signToken } from '@/lib/jwt';
import { LoginActivity } from '@/models/LoginActivity';

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, password, role = 'patient' } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Optional: normalize
    const emailNorm = String(email).toLowerCase().trim();

    // Pre-check for duplicate email
    const exists = await User.findOne({ email: emailNorm }).lean();
    if (exists) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    const hash = await hashPassword(String(password));
    const user = await User.create({
      name: String(name).trim(),
      email: emailNorm,
      password: hash,
      role
    });

    const token = signToken({ sub: user._id.toString(), email: user.email, role: user.role });
    
    // Track login activity for new user registration
    const today = new Date();
    const localKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    await LoginActivity.create({
      user: user._id,
      date: localKey,
      loginCount: 1,
      lastLoginTime: new Date()
    });
    
    const res = NextResponse.json(
      { user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
    
    // Set auth cookie
    res.cookies.set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true only under HTTPS
      path: '/',
      maxAge: 60 * 60
    });

    return res;
  } catch (err: any) {
    console.error('REGISTER_ERROR', err?.message, err?.code, err); // logs to server output
    if (err?.code === 11000) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Registration failed', error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
