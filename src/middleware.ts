// middleware.ts (allow auth pages)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function readToken(token: string) {
  try { const { payload } = await jwtVerify(token, SECRET); return payload as any; } catch { return null; }
}

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const token = req.cookies.get('auth')?.value || '';
  const isDoctorArea = pathname.startsWith('/doctor');
  const isPatientArea = pathname.startsWith('/patient');

  const payload = token ? await readToken(token) : null;

  if (!payload && (isDoctorArea || isPatientArea)) {
    return NextResponse.redirect(new URL('/login', origin));
  }
  if (payload && isDoctorArea && payload.role !== 'doctor') {
    return NextResponse.redirect(new URL('/patient', origin));
  }
  if (payload && isPatientArea && payload.role !== 'patient') {
    return NextResponse.redirect(new URL('/doctor', origin));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
