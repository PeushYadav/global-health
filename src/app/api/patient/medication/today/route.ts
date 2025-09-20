// app/api/patient/medications/today/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { MedicalProfile } from '@/models/MedicalProfile';
import { DailyLog } from '@/models/DailyLog';
import { ymdLocal } from '@/utils/date';
const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getUid() {
  const cookieStore = await cookies();
  const t = cookieStore.get('auth')?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, SECRET);
    return String(payload.sub || '');
  } catch {
    return null;
  }
}

export async function GET() {
  await connectDB();
  const id = await getUid();
  if (!id) return NextResponse.json({ meds:[], taken:[] }, { status: 401 });
  const prof = await MedicalProfile.findOne({ user: id }).lean();
  const today = ymdLocal(new Date());
  const log = await DailyLog.findOne({ patient: id, date: today }).lean();
  const taken = new Set<string>((log as any)?.medicationsTaken || []);
  const meds = ((prof as any)?.medications || []).map((m: any) => ({
    name: m.name, dosage: m.dosage, timing: m.timing, taken: taken.has(m.name)
  }));
  return NextResponse.json({ meds, taken: Array.from(taken) });
}
