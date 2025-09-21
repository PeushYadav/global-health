// app/api/notifications/appointment-reminders/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Appointment } from '@/models/Appointment';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST() {
  try {
    await connectDB();
    
    // Get tomorrow's date for appointment reminders
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    // Find appointments scheduled for tomorrow
    const appointments = await Appointment.find({
      when: {
        $gte: tomorrowStart,
        $lte: tomorrowEnd
      },
      status: { $in: ['confirmed', 'upcoming'] }
    }).lean();

    const sentEmails = [];
    const errors = [];

    for (const appointment of appointments) {
      try {
        const appointmentData = appointment as any;
        
        // Get patient details
        const patientData = await User.findById(appointmentData.patient).select('name email').lean();
        const patient = patientData as any;
        if (!patient) continue;

        // Format appointment details
        const appointmentDate = new Date(appointmentData.when).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const appointmentTime = new Date(appointmentData.when).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Generate email template
        const emailContent = emailTemplates.appointmentReminder(
          patient.name || patient.email.split('@')[0],
          appointmentData.doctorName || 'Your Doctor',
          appointmentDate,
          appointmentTime,
          appointmentData.location || 'Medical Center'
        );

        // Send email to patient
        const result = await sendEmail({
          to: patient.email,
          subject: emailContent.subject,
          html: emailContent.html
        });

        if (result.success) {
          sentEmails.push({
            appointmentId: appointmentData._id,
            patientEmail: patient.email,
            messageId: result.messageId
          });
        } else {
          errors.push({
            appointmentId: appointmentData._id,
            patientEmail: patient.email,
            error: result.error
          });
        }

        // Also send reminder to doctor if they have an email
        if (appointmentData.doctor) {
          const doctorData = await User.findById(appointmentData.doctor).select('name email').lean();
          const doctor = doctorData as any;
          if (doctor && doctor.email) {
            const doctorEmailContent = {
              subject: `Patient Appointment Tomorrow - ${patient.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏥 MedTrack</h1>
                      <h2 style="color: #374151; margin: 10px 0 0 0; font-weight: normal;">Appointment Reminder</h2>
                    </div>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                      Hello <strong>Dr. ${doctor.name || 'Doctor'}</strong>,
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                      You have an appointment tomorrow with <strong>${patient.name}</strong>:
                    </p>
                    
                    <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 20px 0;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #6b7280; font-weight: bold;">Patient:</span>
                        <span style="color: #374151;">${patient.name}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #6b7280; font-weight: bold;">Date:</span>
                        <span style="color: #374151;">${appointmentDate}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #6b7280; font-weight: bold;">Time:</span>
                        <span style="color: #374151;">${appointmentTime}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280; font-weight: bold;">Reason:</span>
                        <span style="color: #374151;">${appointmentData.reason || 'General consultation'}</span>
                      </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/doctor" 
                         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        View Patient Details
                      </a>
                    </div>
                  </div>
                </div>
              `
            };

            const doctorResult = await sendEmail({
              to: doctor.email,
              subject: doctorEmailContent.subject,
              html: doctorEmailContent.html
            });

            if (doctorResult.success) {
              sentEmails.push({
                appointmentId: appointmentData._id,
                doctorEmail: doctor.email,
                messageId: doctorResult.messageId
              });
            }
          }
        }

      } catch (error) {
        errors.push({
          appointmentId: (appointment as any)._id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Appointment reminders processed`,
      stats: {
        appointmentsFound: appointments.length,
        emailsSent: sentEmails.length,
        errors: errors.length
      },
      sentEmails,
      errors
    });

  } catch (error) {
    console.error('Appointment reminders job failed:', error);
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
    message: 'Appointment reminder service is active',
    endpoint: 'POST /api/notifications/appointment-reminders',
    description: 'Sends appointment reminders 24 hours before scheduled appointments'
  });
}