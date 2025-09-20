// app/api/doctors/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');
async function uid(){ const t=cookies().get('auth')?.value; if(!t) return null; try{const {payload}=await jwtVerify(t,SECRET); return String(payload.sub||'');}catch{return null;} }

export async function GET(req: NextRequest) {
  await connectDB();
  const id = await uid();
  if (!id) return NextResponse.json([], { status: 401 });
  const upcoming = req.nextUrl.searchParams.get('upcoming') === 'true';
  const q: any = { patient: id };
  if (upcoming) q.when = { $gte: new Date() };
  const items = await Appointment.find(q).sort({ when: 1 }).limit(10).lean();
  return NextResponse.json(items);
}
