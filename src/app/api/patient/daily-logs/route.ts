// app/api/patient/daily-log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { DailyLog } from '@/models/DailyLog';
import { TZ, ymdLocal } from '@/utils/date';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getUid() {
  const cookieStore = await cookies();
  const t = cookieStore.get('auth')?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, SECRET); return String((payload as any).sub || ''); }
  catch { return null; }
}

export async function GET(req: NextRequest) {
  await connectDB();
  const uid = await getUid();
  if (!uid) return NextResponse.json([], { status: 401 });

  const range = Number(req.nextUrl.searchParams.get('range') || 30);
  const end = new Date(); // now in server TZ; keys are generated via ymdLocal
  const start = new Date(end);
  start.setDate(end.getDate() - (range - 1));

  // Load all logs since start using the same local key space
  const startKey = ymdLocal(start);
  const logs = await DailyLog.find({ patient: uid, date: { $gte: startKey } }).lean();
  const logMap = new Map<string, any>();
  logs.forEach((l: any) => {
    logMap.set(l.date, l);
  });

  const days = [];
  const cursor = new Date(start);
  for (let i = 0; i < range; i++) {
    const key = ymdLocal(cursor);
    const log = logMap.get(key);
    const hasMedications = log?.medicationsTaken && log.medicationsTaken.length > 0;
    days.push({ date: key, taken: hasMedications });
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json(days);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const uid = await getUid();
  if (!uid) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const key = body?.date ? body.date : ymdLocal(new Date());

  await DailyLog.updateOne(
    { patient: uid, date: key },
    { $setOnInsert: { patient: uid, date: key }, $addToSet: { medicationsTaken: 'all' } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
