// app/api/patient/manual/route.ts (robust version)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { MedicalProfile } from '@/models/MedicalProfile';
import { DeviceData } from '@/models/DeviceData';
import { DailyLog } from '@/models/DailyLog';
import { Appointment } from '@/models/Appointment';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');
const ymd = (d: Date) => d.toISOString().slice(0,10);

async function getPid() {
  const t = cookies().get('auth')?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, SECRET); return String((payload as any).sub || ''); }
  catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB(); // ensure connection before writes. [web:39]
    const pid = await getPid();
    if (!pid) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 }); // cookie missing/invalid. [web:164]

    const body = await req.json(); // parse JSON body from client fetch. [web:39]

    // 1) profile
    try {
      if (body?.profile) {
        const chronic = Array.isArray(body.profile.chronicDiseases) ? body.profile.chronicDiseases : [];
        const meds = Array.isArray(body.profile.medications) ? body.profile.medications : [];
        await MedicalProfile.updateOne(
          { user: pid },
          { $set: { chronicDiseases: chronic, medications: meds }, $setOnInsert: { user: pid } },
          { upsert: true, runValidators: true }
        ); // upsert with validators for safer updates. [web:336][web:324]
      }
    } catch (e:any) {
      console.error('PROFILE_WRITE_ERROR', e?.message); // logs to server terminal. [web:326]
      return NextResponse.json({ message: 'Profile save failed', error: e?.message }, { status: 400 });
    }

    // 2) vitals
    try {
      if (body?.vitals) {
        const at = body.vitals.takenAt ? new Date(body.vitals.takenAt) : new Date();
        const ops: Promise<any>[] = [];
        if (typeof body.vitals.hr === 'number') ops.push(DeviceData.create({ patient: pid, type: 'hr', value: body.vitals.hr, unit: 'bpm', takenAt: at }));
        if (typeof body.vitals.bp === 'number') ops.push(DeviceData.create({ patient: pid, type: 'bp', value: body.vitals.bp, unit: 'mmHg', takenAt: at }));
        if (typeof body.vitals.hydration === 'number') ops.push(DeviceData.create({ patient: pid, type: 'hydration', value: body.vitals.hydration, unit: 'ml', takenAt: at }));
        if (ops.length) await Promise.all(ops); // parallel inserts. [web:319]
      }
    } catch (e:any) {
      console.error('VITALS_WRITE_ERROR', e?.message); // server log. [web:326]
      return NextResponse.json({ message: 'Vitals save failed', error: e?.message }, { status: 400 });
    }

    // 3) daily log
    try {
      if (body?.dailyLog?.markTodayTaken) {
        const today = ymd(new Date());
        await DailyLog.updateOne(
          { patient: pid, date: today },
          { $setOnInsert: { patient: pid, date: today }, $addToSet: { medicationsTaken: 'all' } },
          { upsert: true, runValidators: true }
        ); // one log per day enforced by unique index. [web:324][web:336]
      }
    } catch (e:any) {
      console.error('DAILYLOG_WRITE_ERROR', e?.message); // server log. [web:326]
      return NextResponse.json({ message: 'Daily log save failed', error: e?.message }, { status: 400 });
    }

    // 4) optional appointment
    try {
      if (body?.appointment?.doctorName && body?.appointment?.when) {
        await Appointment.create({
          patient: pid,
          doctorName: String(body.appointment.doctorName).trim(),
          when: new Date(body.appointment.when),
          reason: String(body.appointment.reason || '').trim(),
          location: String(body.appointment.location || '').trim(),
          status: 'upcoming'
        }); // insert appointment used by list and calendar. [web:319]
      }
    } catch (e:any) {
      console.error('APPT_WRITE_ERROR', e?.message); // server log. [web:326]
      return NextResponse.json({ message: 'Appointment save failed', error: e?.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 201 }); // success response for client. [web:39]
  } catch (e:any) {
    console.error('MANUAL_ENTRY_FATAL', e?.message); // top-level fallback. [web:326]
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 }); // generic 500 with detail. [web:146]
  }
}
