// app/api/patient/leaderboard/route.ts
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

interface LeaderboardEntry {
  userId: string;
  name: string;
  streak: number;
  score: number;
  isCurrentUser: boolean;
  lastComplianceDate?: string;
}

async function calculateUserStreak(userId: string): Promise<{ streak: number; lastComplianceDate?: string }> {
  try {
    // Get user's prescribed medications
    const medProfile = await MedicalProfile.findOne({ user: userId }).lean();
    const prescribedMeds = ((medProfile as any)?.medications || []).map((m: any) => m.name);
    
    if (prescribedMeds.length === 0) {
      return { streak: 0 };
    }

    // Get medication logs for the past 30 days
    const today = new Date();
    const dateRange: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateRange.push(ymdLocal(date));
    }

    const dailyLogs = await DailyLog.find({
      patient: userId,
      date: { $in: dateRange }
    }).lean();

    const logMap = new Map();
    dailyLogs.forEach((log: any) => {
      logMap.set(log.date, new Set(log.medicationsTaken || []));
    });

    // Calculate streak from today backwards
    let daysSinceFullCompliance = 0;
    let lastFullComplianceDate: string | undefined;
    
    const todayStr = ymdLocal(today);
    const todaysTaken = logMap.get(todayStr) || new Set();
    const todaysComplete = prescribedMeds.every((med: string) => todaysTaken.has(med));

    // Start counting from yesterday if today is complete, otherwise from today
    let startIndex = todaysComplete ? 1 : 0;
    
    for (let i = startIndex; i < dateRange.length; i++) {
      const dateStr = dateRange[i];
      const takenMeds = logMap.get(dateStr) || new Set();
      const allTaken = prescribedMeds.every((med: string) => takenMeds.has(med));
      
      if (allTaken) {
        lastFullComplianceDate = dateStr;
        break;
      } else {
        daysSinceFullCompliance++;
      }
    }

    // Cap at 30 days maximum
    daysSinceFullCompliance = Math.min(daysSinceFullCompliance, 30);

    return { 
      streak: daysSinceFullCompliance,
      lastComplianceDate: lastFullComplianceDate
    };
  } catch (error) {
    console.error(`Error calculating streak for user ${userId}:`, error);
    return { streak: 30 }; // Worst possible score on error
  }
}

function calculateScore(daysSinceCompliance: number): number {
  // When daysSinceCompliance is 30 (day30.svg), score is 0
  if (daysSinceCompliance >= 30) return 0;
  
  // Perfect streak (0 days) gets max score (100)
  // Score decreases as days since compliance increase
  return Math.max(0, 100 - (daysSinceCompliance * 3));
}

export async function GET() {
  try {
    await connectDB();
    const currentUserId = await getUid();
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all patients (users with role 'patient')
    const patients = await User.find({ role: 'patient' }).lean();
    
    if (patients.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate streaks for all patients
    const leaderboardPromises = patients.map(async (user: any) => {
      const { streak, lastComplianceDate } = await calculateUserStreak(user._id.toString());
      const score = calculateScore(streak);
      
      return {
        userId: user._id.toString(),
        name: user.name,
        streak,
        score,
        isCurrentUser: user._id.toString() === currentUserId,
        lastComplianceDate
      } as LeaderboardEntry;
    });

    const leaderboardData = await Promise.all(leaderboardPromises);
    
    // Sort by score (highest first), then by streak (lowest first for tie-breaking)
    const sortedLeaderboard = leaderboardData.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return a.streak - b.streak; // Lower streak (better) first for tie-breaking
    });

    // Add rank to each entry
    const rankedLeaderboard = sortedLeaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json(rankedLeaderboard);
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}