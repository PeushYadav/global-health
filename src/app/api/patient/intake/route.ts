// app/api/patient/intake/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { MedicalProfile } from '@/models/MedicalProfile';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getUserIdFromCookie() {
  const token = cookies().get('auth')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return String(payload.sub || '');
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest) {
  await connectDB();
  const uid = await getUserIdFromCookie();
  if (!uid) return NextResponse.json({ exists: false }, { status: 401 });

  const profile = await MedicalProfile.findOne({ user: uid }).lean();
  return NextResponse.json({ exists: !!profile }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const uid = await getUserIdFromCookie();
    if (!uid) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const owner = await User.findById(uid).lean();
    if (!owner) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const existing = await MedicalProfile.findOne({ user: uid }).lean();
    if (existing) {
      return NextResponse.json({ message: 'Profile already exists' }, { status: 200 });
    }

    const body = await req.json();
    const {
      chronicDiseases = '',
      medications = [],
      consultingDoctor = '',
      doctorOnPlatform = 'maybe',
      doctorEmail = ''
    } = body || {};

    // Normalize
    const diseases =
      Array.isArray(chronicDiseases)
        ? chronicDiseases
        : String(chronicDiseases)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    const meds = Array.isArray(medications)
      ? medications.map((m) => ({
          name: String(m?.name || '').trim(),
          dosage: String(m?.dosage || '').trim(),
          timing: String(m?.timing || '').trim()
        }))
      : [];

    if ((doctorOnPlatform === 'no' || doctorOnPlatform === 'maybe') && !doctorEmail) {
      return NextResponse.json({ message: 'Doctor email required' }, { status: 400 });
    }

    await MedicalProfile.create({
      user: uid,
      chronicDiseases: diseases,
      medications: meds,
      consultingDoctor: String(consultingDoctor || '').trim(),
      doctorOnPlatform,
      doctorEmail: String(doctorEmail || '').trim() || undefined
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: 'Failed to save profile', error: e?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
