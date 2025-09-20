// app/api/patient/login-activity/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { LoginActivity } from '@/models/LoginActivity';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth')?.value;
    if (!token) return null;
    
    const { payload } = await jwtVerify(token, SECRET);
    return String(payload.sub || '');
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'streak') {
      // Calculate login streak
      const loginStreak = await calculateLoginStreak(userId);
      return NextResponse.json({ streak: loginStreak });
    }

    // Get last 60 days of login activity
    const loginActivities = await LoginActivity.find({ user: userId })
      .select('date loginCount')
      .sort({ date: -1 })
      .limit(60)
      .lean();

    return NextResponse.json(loginActivities);
  } catch (error) {
    console.error('Error fetching login activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function calculateLoginStreak(userId: string): Promise<number> {
  try {
    // Get all login activities for the user, sorted by date descending
    const loginActivities = await LoginActivity.find({ user: userId })
      .select('date')
      .sort({ date: -1 })
      .lean();

    if (loginActivities.length === 0) {
      return 0;
    }

    let streak = 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    // Create a set of login dates for faster lookup
    const loginDates = new Set(loginActivities.map(activity => activity.date));
    
    // Start from today and count backwards
    const currentDate = new Date(today);
    
    while (true) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
      
      if (loginDates.has(dateStr)) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating login streak:', error);
    return 0;
  }
}