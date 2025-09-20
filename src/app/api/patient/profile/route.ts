// app/api/patient/profile/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { MedicalProfile } from '@/models/MedicalProfile';

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

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await MedicalProfile.findOne({ user: userId })
      .select('consultingDoctor doctorOnPlatform doctorEmail')
      .lean();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      consultingDoctor: (profile as any).consultingDoctor || 'Your Doctor',
      doctorOnPlatform: (profile as any).doctorOnPlatform,
      doctorEmail: (profile as any).doctorEmail,
      doctorLocation: 'Medical Center' // Default location
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}