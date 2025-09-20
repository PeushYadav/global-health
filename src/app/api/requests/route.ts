// app/api/doctor/requests/route.ts  (doctor’s pending queue)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { CareRequest } from '@/models/CareRequest';
import { User } from '@/models/User';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');
async function doctorId() {
  const t = cookies().get('auth')?.value; if (!t) return null;
  try { const { payload } = await jwtVerify(t, SECRET); return (payload as any).role === 'doctor' ? String(payload.sub) : null; } catch { return null; }
}

export async function GET() {
  await connectDB();
  const did = await doctorId();
  if (!did) return NextResponse.json([], { status: 401 });

  const reqs = await CareRequest.find({ doctor: did, status: 'pending' }).sort({ createdAt: -1 }).lean();
  const patientIds = reqs.map(r => r.patient);
  const users = await User.find({ _id: { $in: patientIds } }).select('_id name email').lean();
  const map = new Map(users.map(u => [String(u._id), u]));

  const out = reqs.map(r => ({
    id: String(r._id),
    patient: { id: String(r.patient), name: map.get(String(r.patient))?.name, email: map.get(String(r.patient))?.email },
    reason: r.reason,
    conditions: r.conditions,
    currentMeds: r.currentMeds,
    preferredTime: r.preferredTime,
    notes: r.notes,
    createdAt: r.createdAt
  }));
  return NextResponse.json(out);
}

export async function PATCH(req: NextRequest) {
  await connectDB();
  const did = await doctorId();
  if (!did) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id, action } = await req.json();
  const nextStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : null;
  if (!id || !nextStatus) return NextResponse.json({ message: 'Bad request' }, { status: 400 });

  const r = await CareRequest.findOne({ _id: id, doctor: did });
  if (!r) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  r.status = nextStatus;
  await r.save();
  return NextResponse.json({ ok: true, status: nextStatus });
}
