// app/api/notifications/medication-reminders/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { MedicalProfile } from '@/models/MedicalProfile';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST() {
  try {
    await connectDB();
    
    // Get all patients with medical profiles
    const patients = await User.find({ role: 'patient' }).select('_id name email').lean();
    const sentEmails = [];
    const errors = [];

    for (const patient of patients) {
      try {
        // Get patient's medical profile with medications
        const profileData = await MedicalProfile.findOne({ user: patient._id }).lean();
        const profile = profileData as any; // Type assertion for lean query
        
        if (!profile || !profile.medications || profile.medications.length === 0) {
          continue; // Skip patients without medications
        }

        // Prepare medication data
        const medications = profile.medications.map((med: any) => ({
          name: med.name,
          dosage: med.dosage,
          timing: med.timing
        }));

        // Generate email template
        const emailContent = emailTemplates.medicationReminder(
          patient.name || patient.email.split('@')[0],
          medications
        );

        // Send email
        const result = await sendEmail({
          to: patient.email,
          subject: emailContent.subject,
          html: emailContent.html
        });

        if (result.success) {
          sentEmails.push({
            patientId: patient._id,
            email: patient.email,
            messageId: result.messageId
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
      message: `Medication reminders processed`,
      stats: {
        total: patients.length,
        sent: sentEmails.length,
        errors: errors.length
      },
      sentEmails,
      errors
    });

  } catch (error) {
    console.error('Medication reminder cron job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Medication reminder service is active',
    endpoint: 'POST /api/notifications/medication-reminders',
    description: 'Sends daily medication reminders to all patients with prescribed medications'
  });
}