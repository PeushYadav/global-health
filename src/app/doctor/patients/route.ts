// app/api/doctor/patients/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
import { Message } from '@/models/Message';
import { User } from '@/models/User';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');
async function doctorId() {
  const t = cookies().get('auth')?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, SECRET); return (payload as any).role === 'doctor' ? String(payload.sub) : null; } catch { return null; }
}

export async function GET() {
  await connectDB();
  const did = await doctorId();
  if (!did) return NextResponse.json([], { status: 401 });

  const ap = await Appointment.find({ doctor: did }).distinct('patient');
  const threads = await Message.find({ $or: [{ from: did }, { to: did }] }).distinct('threadKey');
  const patientIdsFromThreads = threads
    .map((k: string) => k.split(':')[0]) // threadKey `${patientId}:${doctorId}`
    .filter((pid) => pid && pid !== did);

  const ids = Array.from(new Set([...ap, ...patientIdsFromThreads])).filter(Boolean);
  const users = await User.find({ _id: { $in: ids } }).select('_id name email').lean();

  return NextResponse.json(users.map(u => ({ id: String(u._id), name: u.name, email: u.email })));
}
