// lib/jwt.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// HARD-CODED for local dev only
const SECRET = 'dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb';
const EXPIRES = '1h';

type Payload = { sub: string; email: string; role: 'doctor' | 'patient' };

export function signToken(payload: Payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as Payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  // Tip: if developing on http://localhost, you can set secure: false to ensure the cookie is set over HTTP.
  cookies().set('auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set false for localhost HTTP; set true when using HTTPS
    path: '/',
    maxAge: 60 * 60 // 1h
  });
}

export function clearAuthCookie() {
  cookies().set('auth', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 0
  });
}
