// app/api/notifications/streak-alerts/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { MedicalProfile } from '@/models/MedicalProfile';
import { DailyLog } from '@/models/DailyLog';
import { sendNotificationEmail } from '@/lib/emailjs';
import { ymdLocal } from '@/utils/date';

// Helper function to calculate medication streak
async function calculatePatientStreak(patientId: string) {
  const profile = await MedicalProfile.findOne({ user: patientId }).lean() as any;
  if (!profile || !profile.medications || profile.medications.length === 0) {
    return { streakDays: 0, adherenceRate: 0, isBreaking: false, shouldAlert: false };
  }

  const today = new Date();
  const last30Days = [];
  
  // Get last 30 days of data
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    last30Days.push(ymdLocal(date));
  }

  const logs = await DailyLog.find({
    user: patientId,
    date: { $in: last30Days }
  }).lean();

  const logMap = new Map(logs.map(log => [log.date, log]));
  
  let currentStreak = 0;
  let totalTaken = 0;
  let totalExpected = last30Days.length * profile.medications.length;

  // Calculate current streak (from today backwards)
  for (let i = 0; i < last30Days.length; i++) {
    const date = last30Days[i];
    const log = logMap.get(date) as any;
    
    if (log && log.medicationsTaken && log.medicationsTaken.length > 0) {
      const takenToday = log.medicationsTaken.filter((med: any) => med.taken).length;
      totalTaken += takenToday;
      
      // Check if all medications were taken
      if (takenToday >= profile.medications.length) {
        if (i === 0 || currentStreak === i) { // Continue streak only if consecutive
          currentStreak = i + 1;
        }
      } else {
        break; // Streak broken
      }
    } else {
      break; // No log = streak broken
    }
  }

  const adherenceRate = Math.round((totalTaken / totalExpected) * 100);
  
  // Determine if we should send alerts
  const isBreaking = currentStreak === 0 && totalTaken < (totalExpected * 0.7); // Less than 70% adherence
  const isMilestone = currentStreak > 0 && [7, 14, 30, 60, 90].includes(currentStreak);
  
  return { 
    streakDays: currentStreak, 
    adherenceRate, 
    isBreaking,
    shouldAlert: isBreaking || isMilestone 
  };
}

export async function POST() {
  try {
    await connectDB();
    
    // Get all patients
    const patients = await User.find({ role: 'patient' }).select('_id name email').lean();
    const sentEmails = [];
    const errors = [];

    for (const patient of patients) {
      try {
        const streakData = await calculatePatientStreak(String(patient._id));
        
        if (!streakData.shouldAlert) {
          continue; // Skip patients who don't need alerts
        }

        let subject, message;
        
        if (streakData.isBreaking) {
          subject = "Don't Give Up - Your Health Journey Matters! 💪";
          message = `Hi ${patient.name || 'there'}! We noticed you might be having trouble with your medication routine. Your current adherence is ${streakData.adherenceRate}%. Remember, every day is a new opportunity to take care of your health. We're here to support you!`;
        } else {
          subject = `Congratulations! ${streakData.streakDays}-Day Streak Achieved! 🎉`;
          message = `Amazing work ${patient.name || 'there'}! You've successfully maintained your medication routine for ${streakData.streakDays} days straight. Your adherence rate is ${streakData.adherenceRate}%. Keep up the fantastic progress!`;
        }

        // Send email using EmailJS
        const result = await sendNotificationEmail({
          userName: patient.name || patient.email.split('@')[0],
          email: patient.email,
          subject: subject,
          message: message,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/patient`
        });

        if (result.success) {
          sentEmails.push({
            patientId: patient._id,
            email: patient.email,
            messageId: result.messageId,
            alertType: streakData.isBreaking ? 'streak_breaking' : 'milestone',
            streakDays: streakData.streakDays,
            adherenceRate: streakData.adherenceRate
          });
        } else {
          errors.push({
            patientId: patient._id,
            email: patient.email,
            error: result.error
          });
        }
      } catch (error) {
        errors.push({
          patientId: patient._id,
          email: patient.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Streak alerts processed`,
      stats: {
        total: patients.length,
        sent: sentEmails.length,
        errors: errors.length
      },
      sentEmails,
      errors
    });

  } catch (error) {
    console.error('Streak alerts job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Streak alert service is active',
    endpoint: 'POST /api/notifications/streak-alerts',
    description: 'Sends streak milestone and breaking alerts to patients'
  });
}