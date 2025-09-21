// app/api/notifications/appointment-reminders/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Appointment } from '@/models/Appointment';
import { sendNotificationEmail } from '@/lib/emailjs';

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

        // Generate appointment reminder message
        const subject = `Appointment Reminder Tomorrow - ${appointmentDate}`;
        const message = `Hi ${patient.name || 'there'}! This is a reminder about your appointment tomorrow (${appointmentDate}) at ${appointmentTime} with ${appointmentData.doctorName || 'your doctor'}. Please arrive 15 minutes early. Location: ${appointmentData.location || 'Medical Center'}`;

        // Send email to patient using EmailJS
        const result = await sendNotificationEmail({
          userName: patient.name || patient.email.split('@')[0],
          email: patient.email,
          subject: subject,
          message: message,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/patient`
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
            const doctorSubject = `Patient Appointment Tomorrow - ${patient.name}`;
            const doctorMessage = `Hello Dr. ${doctor.name || 'Doctor'}! You have an appointment tomorrow with patient ${patient.name} on ${appointmentDate} at ${appointmentTime}. Reason: ${appointmentData.reason || 'General consultation'}`;

            const doctorResult = await sendNotificationEmail({
              userName: doctor.name || 'Doctor',
              email: doctor.email,
              subject: doctorSubject,
              message: doctorMessage,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/doctor`
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