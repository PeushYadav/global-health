// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyPassword } from '@/lib/bcrypt';
import jwt from 'jsonwebtoken';

const SECRET = 'dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const ok = await verifyPassword(String(password), user.password);
    if (!ok) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      SECRET,
      { expiresIn: '1h' }
    );

    const res = NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

    // Important for localhost (HTTP): secure must be false
    res.cookies.set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true only under HTTPS
      path: '/',
      maxAge: 60 * 60
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ message: 'Login failed', error: e?.message || 'Unknown' }, { status: 500 });
  }
}
