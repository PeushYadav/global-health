// app/api/patient/metrics/latest/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { DeviceData } from '@/models/DeviceData';
const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function uid() {
  const t = cookies().get('auth')?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, SECRET); return String(payload.sub||''); } catch { return null; }
}

export async function GET() {
  await connectDB();
  const id = await uid();
  if (!id) return NextResponse.json({ hr:null,bp:null,hydration:null }, { status: 401 });
  async function latest(type: string) {
    const r = await DeviceData.findOne({ patient: id, type }).sort({ takenAt: -1 }).lean();
    return r ? { value: r.value, unit: r.unit, at: r.takenAt } : null;
  }
  const [hr, bp, hydration] = await Promise.all([latest('hr'), latest('bp'), latest('hydration')]);
  return NextResponse.json({ hr, bp, hydration });
}
