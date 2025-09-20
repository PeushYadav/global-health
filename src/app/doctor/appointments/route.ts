// app/api/doctor/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');
async function doctorId() {
  const t = cookies().get('auth')?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, SECRET); return (payload as any).role === 'doctor' ? String(payload.sub) : null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  await connectDB();
  const did = await doctorId();
  if (!did) return NextResponse.json([], { status: 401 });

  const status = req.nextUrl.searchParams.get('status'); // optional: 'pending' | 'upcoming'
  const q: any = { doctor: did };
  if (status) q.status = status;

  const items = await Appointment.find(q).sort({ when: 1 }).limit(50).lean();
  return NextResponse.json(items.map(a => ({
    id: String(a._id),
    patient: String(a.patient),
    doctorName: a.doctorName,
    when: a.when,
    reason: a.reason,
    location: a.location,
    status: a.status
  })));
}

export async function PATCH(req: NextRequest) {
  await connectDB();
  const did = await doctorId();
  if (!did) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id, action } = await req.json();
  // Accept => status: 'upcoming', Decline => status: 'cancelled'
  const nextStatus = action === 'accept' ? 'upcoming' : action === 'decline' ? 'cancelled' : null;
  if (!id || !nextStatus) return NextResponse.json({ message: 'Bad request' }, { status: 400 });

  const appt = await Appointment.findOne({ _id: id, doctor: did });
  if (!appt) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  appt.status = nextStatus;
  await appt.save();
  return NextResponse.json({ ok: true, status: nextStatus });
}
