// app/api/notifications/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates, verifyEmailConnection } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { type, email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Test email connection first
    const connectionOk = await verifyEmailConnection();
    if (!connectionOk) {
      return NextResponse.json(
        { 
          error: 'Email service connection failed. Check your SMTP configuration in .env.local' 
        },
        { status: 500 }
      );
    }

    let emailContent;
    
    // Generate test email based on type
    switch (type) {
      case 'medication-reminder':
        emailContent = emailTemplates.medicationReminder('Test Patient', [
          { name: 'Aspirin', dosage: '81mg', timing: 'Morning with breakfast' },
          { name: 'Metformin', dosage: '500mg', timing: 'Twice daily with meals' }
        ]);
        break;
        
      case 'streak-milestone':
        emailContent = emailTemplates.streakMilestone('Test Patient', 7, false);
        break;
        
      case 'streak-breaking':
        emailContent = emailTemplates.streakMilestone('Test Patient', 0, true);
        break;
        
      case 'appointment-reminder':
        emailContent = emailTemplates.appointmentReminder(
          'Test Patient',
          'Dr. Smith',
          'Monday, September 22, 2025',
          '2:00 PM',
          'Medical Center, Room 101'
        );
        break;
        
      case 'doctor-alert':
        emailContent = emailTemplates.doctorPatientAlert('Dr. Test', [
          { name: 'John Doe', streakDays: 14, adherenceRate: 95, missedDoses: 1, status: 'good' },
          { name: 'Jane Smith', streakDays: 2, adherenceRate: 75, missedDoses: 5, status: 'warning' },
          { name: 'Bob Johnson', streakDays: 0, adherenceRate: 45, missedDoses: 12, status: 'critical' }
        ]);
        break;
        
      default:
        // Send a general test email
        emailContent = {
          subject: 'MedTrack Email Test - System Working!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏥 MedTrack</h1>
                  <h2 style="color: #374151; margin: 10px 0 0 0; font-weight: normal;">Email System Test</h2>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                  <h2 style="color: #059669; margin: 0;">Email System is Working!</h2>
                </div>
                
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #374151; margin: 0; line-height: 1.6; text-align: center;">
                    This is a test email from your MedTrack Health application. 
                    If you received this, your email notification system is configured correctly!
                  </p>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #374151; margin: 0 0 15px 0;">Available Email Types:</h3>
                  <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                    <li>Medication Reminders</li>
                    <li>Streak Milestones & Alerts</li>
                    <li>Appointment Reminders</li>
                    <li>Doctor Patient Condition Reports</li>
                  </ul>
                </div>
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                  Test email sent at ${new Date().toLocaleString()}
                </p>
              </div>
            </div>
          `
        };
    }

    // Send the test email
    const result = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        messageId: result.messageId,
        type: type || 'general'
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send test email',
          error: result.error
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test email failed:', error);
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
    message: 'MedTrack Email Test Service',
    description: 'Send test emails to verify your email configuration',
    usage: {
      endpoint: 'POST /api/notifications/test',
      body: {
        email: 'test@example.com',
        type: 'medication-reminder | streak-milestone | streak-breaking | appointment-reminder | doctor-alert | general'
      }
    },
    examples: [
      {
        description: 'Test general email',
        curl: `curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/notifications/test -H "Content-Type: application/json" -d '{"email": "test@example.com"}'`
      },
      {
        description: 'Test medication reminder',
        curl: `curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/notifications/test -H "Content-Type: application/json" -d '{"email": "test@example.com", "type": "medication-reminder"}'`
      }
    ],
    setup: {
      step1: 'Copy .env.email.example to .env.local',
      step2: 'Fill in your SMTP credentials',
      step3: 'Test with: POST /api/notifications/test',
      step4: 'Set up cron jobs using /api/notifications/scheduler'
    }
  });
}