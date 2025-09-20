// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    secure: false, // true under HTTPS
    sameSite: 'lax',
    expires: new Date(0)
  });
  return res;
}
