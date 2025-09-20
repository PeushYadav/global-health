// app/api/doctor/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { DoctorProfile } from '@/models/DoctorProfile';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');
async function doctorId() {
  const t = cookies().get('auth')?.value; if (!t) return null;
  try { const { payload } = await jwtVerify(t, SECRET); return (payload as any).role === 'doctor' ? String(payload.sub) : null; } catch { return null; }
}

export async function GET() {
  await connectDB();
  const id = await doctorId();
  if (!id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const doc = await DoctorProfile.findOne({ user: id }).lean();
  return NextResponse.json(doc || null);
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const id = await doctorId();
  if (!id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const update = {
    specialty: String(body.specialty || '').trim(),
    subSpecialties: Array.isArray(body.subSpecialties) ? body.subSpecialties : [],
    yearsExperience: Number(body.yearsExperience || 0),
    resumeUrl: String(body.resumeUrl || '').trim(),
    bio: String(body.bio || '').trim(),
    languages: Array.isArray(body.languages) ? body.languages : [],
    city: String(body.city || '').trim(),
    acceptingNewPatients: Boolean(body.acceptingNewPatients),
    consultationFee: body.consultationFee ? Number(body.consultationFee) : undefined
  };
  await DoctorProfile.updateOne({ user: id }, { $set: update, $setOnInsert: { user: id } }, { upsert: true });
  return NextResponse.json({ ok: true }, { status: 200 });
}
