// app/api/patient/medication-streak-daily/route.ts
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
  try {
    await connectDB();
    const userId = await getUid();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's prescribed medications
    const medProfile = await MedicalProfile.findOne({ user: userId }).lean();
    const prescribedMeds = ((medProfile as any)?.medications || []).map((m: any) => m.name);
    
    if (prescribedMeds.length === 0) {
      return NextResponse.json({
        daysSinceFullCompliance: 0,
        lastFullComplianceDate: null,
        totalDaysTracked: 0,
        todaysProgress: { taken: 0, total: 0, complete: true }
      });
    }

    // Get medication logs for the past 30 days (max)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Generate date range for the past 30 days
    const dateRange: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateRange.push(ymdLocal(date));
    }

    // Get all daily logs for this date range
    const dailyLogs = await DailyLog.find({
      patient: userId,
      date: { $in: dateRange }
    }).lean();

    // Convert to a map for easy lookup
    const logMap = new Map();
    dailyLogs.forEach((log: any) => {
      logMap.set(log.date, new Set(log.medicationsTaken || []));
    });

    // Calculate streak from today backwards
    let daysSinceFullCompliance = 0;
    let lastFullComplianceDate: string | null = null;
    
    const todayStr = ymdLocal(today);
    const todaysTaken = logMap.get(todayStr) || new Set();
    const todaysProgress = {
      taken: todaysTaken.size,
      total: prescribedMeds.length,
      complete: prescribedMeds.every((med: string) => todaysTaken.has(med))
    };

    // If today is complete, start counting from yesterday
    let startIndex = todaysProgress.complete ? 1 : 0;
    
    for (let i = startIndex; i < dateRange.length; i++) {
      const dateStr = dateRange[i];
      const takenMeds = logMap.get(dateStr) || new Set();
      
      // Check if all prescribed medications were taken on this day
      const allTaken = prescribedMeds.every((med: string) => takenMeds.has(med));
      
      if (allTaken) {
        // Found a day with full compliance, stop counting
        lastFullComplianceDate = dateStr;
        break;
      } else {
        // This day had incomplete compliance
        daysSinceFullCompliance++;
      }
    }

    // Cap at 30 days maximum
    daysSinceFullCompliance = Math.min(daysSinceFullCompliance, 30);

    const streakData = {
      daysSinceFullCompliance,
      lastFullComplianceDate,
      totalDaysTracked: dailyLogs.length,
      todaysProgress
    };

    return NextResponse.json(streakData);
    
  } catch (error) {
    console.error('Error fetching medication streak:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medication streak' },
      { status: 500 }
    );
  }
}