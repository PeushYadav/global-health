// app/api/doctor/patient-logs/[patientId]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    await connectDB();
    const doctorId = await getUid();
    
    if (!doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the doctor has access to this patient
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json({ error: 'Not authorized as doctor' }, { status: 403 });
    }

    const { patientId } = await params;
    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get('range') || '30');
    
    // Verify patient exists and is actually a patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get patient's prescribed medications for context
    const medProfile = await MedicalProfile.findOne({ user: patientId }).lean();
    const prescribedMeds = ((medProfile as any)?.medications || []).map((m: any) => m.name);

    // Generate date range
    const today = new Date();
    const dateRange: string[] = [];
    for (let i = 0; i < range; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateRange.push(ymdLocal(date));
    }

    // Get daily logs for this date range
    const dailyLogs = await DailyLog.find({
      patient: patientId,
      date: { $in: dateRange }
    }).lean();

    // Create a map for easy lookup
    const logMap = new Map();
    dailyLogs.forEach((log: any) => {
      logMap.set(log.date, log);
    });

    // Build response data with calculated metrics
    const responseData = dateRange.reverse().map(dateStr => {
      const log = logMap.get(dateStr);
      const medicationsTaken = log?.medicationsTaken || [];
      const allTaken = prescribedMeds.length > 0 
        ? prescribedMeds.every((med: string) => medicationsTaken.includes(med))
        : false;

      // Calculate days since compliance up to this date
      let daysSinceCompliance = 0;
      const currentDate = new Date(dateStr);
      
      // Look backward from current date to find last compliance
      for (let i = 0; i < range; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(currentDate.getDate() - i);
        const checkDateStr = ymdLocal(checkDate);
        const checkLog = logMap.get(checkDateStr);
        
        if (checkLog) {
          const checkMeds = checkLog.medicationsTaken || [];
          const wasCompliant = prescribedMeds.length > 0 
            ? prescribedMeds.every((med: string) => checkMeds.includes(med))
            : false;
            
          if (wasCompliant) {
            break;
          } else {
            daysSinceCompliance++;
          }
        } else {
          daysSinceCompliance++;
        }
      }

      return {
        date: dateStr,
        medicationsTaken,
        taken: allTaken,
        daysSinceCompliance: Math.min(daysSinceCompliance, 30),
        prescribedCount: prescribedMeds.length,
        takenCount: medicationsTaken.length
      };
    });

    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error fetching patient logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient logs' },
      { status: 500 }
    );
  }
}