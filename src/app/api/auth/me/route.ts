// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const { payload } = await jwtVerify(token, SECRET);
    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}