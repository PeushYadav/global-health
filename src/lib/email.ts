// lib/email.ts
// Note: Install nodemailer and @types/nodemailer: npm install nodemailer @types/nodemailer
interface NodemailerTransporter {
  sendMail: (options: any) => Promise<any>;
  verify: () => Promise<boolean>;
}

// Mock nodemailer interface for now - replace with actual import when installed
const nodemailer = {
  createTransporter: (config: any): NodemailerTransporter => ({
    sendMail: async (options: any) => ({ messageId: 'mock-id-' + Date.now() }),
    verify: async () => true
  })
};

// Email configuration - using environment variables for security
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'medtrack.health@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'your-app-password'
  }
};

// Create reusable transporter object
const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

// Verify connection configuration
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('Email server is ready to take our messages');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
}

// Generic email sending function
export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `"MedTrack Health" <${EMAIL_CONFIG.auth.user}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email templates
export const emailTemplates = {
  medicationReminder: (patientName: string, medications: Array<{ name: string; dosage: string; timing: string }>) => ({
    subject: `Daily Medication Reminder - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏥 MedTrack</h1>
            <h2 style="color: #374151; margin: 10px 0 0 0; font-weight: normal;">Medication Reminder</h2>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hello <strong>${patientName}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            It's time to take your medications! Here's your daily medication schedule:
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${medications.map(med => `
              <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-radius: 6px; border-left: 4px solid #10b981;">
                <h3 style="color: #059669; margin: 0 0 8px 0; font-size: 18px;">${med.name}</h3>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  <strong>Dosage:</strong> ${med.dosage} | <strong>Timing:</strong> ${med.timing}
                </p>
              </div>
            `).join('')}
          </div>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1d4ed8; margin: 0; font-size: 14px; text-align: center;">
              💪 Keep up your streak! Taking medications consistently helps maintain your health.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/patient" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Mark as Taken
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            This is an automated reminder from MedTrack Health. Stay healthy!
          </p>
        </div>
      </div>
    `
  }),

  streakMilestone: (patientName: string, streakDays: number, isBreaking: boolean) => ({
    subject: isBreaking ? '⚠️ Medication Streak Alert' : `🎉 ${streakDays} Day Streak Achievement!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏥 MedTrack</h1>
            <h2 style="color: ${isBreaking ? '#dc2626' : '#059669'}; margin: 10px 0 0 0; font-weight: normal;">
              ${isBreaking ? 'Streak Alert' : 'Streak Milestone'}
            </h2>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 72px; margin-bottom: 20px;">
              ${isBreaking ? '⚠️' : '🎉'}
            </div>
            <h2 style="color: #374151; margin: 0; font-size: 24px;">
              Hello ${patientName}!
            </h2>
          </div>
          
          ${isBreaking ? `
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0;">Streak Breaking Alert</h3>
              <p style="color: #374151; margin: 0; line-height: 1.6;">
                We noticed you might have missed some medications recently. Don't worry - it's never too late to get back on track! 
                Your health journey continues, and every day is a new opportunity to take care of yourself.
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/patient" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Get Back on Track
              </a>
            </div>
          ` : `
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 10px 0;">🏆 Amazing Achievement!</h3>
              <p style="color: #374151; margin: 0; line-height: 1.6;">
                Congratulations! You've maintained your medication streak for <strong>${streakDays} consecutive days</strong>. 
                Your dedication to your health is truly inspiring!
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/patient" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Dashboard
              </a>
            </div>
          `}
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            Keep up the great work! Your health matters.
          </p>
        </div>
      </div>
    `
  }),

  appointmentReminder: (patientName: string, doctorName: string, appointmentDate: string, appointmentTime: string, location: string) => ({
    subject: `Appointment Reminder - Tomorrow at ${appointmentTime}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏥 MedTrack</h1>
            <h2 style="color: #374151; margin: 10px 0 0 0; font-weight: normal;">Appointment Reminder</h2>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 48px; margin-bottom: 20px;">📅</div>
            <h2 style="color: #374151; margin: 0;">Hello ${patientName}!</h2>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0; text-align: center;">Upcoming Appointment</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280; font-weight: bold;">Doctor:</span>
              <span style="color: #374151;">${doctorName}</span>
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
              <span style="color: #6b7280; font-weight: bold;">Location:</span>
              <span style="color: #374151;">${location}</span>
            </div>
          </div>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1d4ed8; margin: 0; font-size: 14px; text-align: center;">
              💡 Remember to bring your medication list and any questions you have for your doctor.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/patient" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Appointment Details
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            If you need to reschedule, please contact your doctor's office as soon as possible.
          </p>
        </div>
      </div>
    `
  }),

  doctorPatientAlert: (doctorName: string, patientReports: Array<{ 
    name: string; 
    streakDays: number; 
    adherenceRate: number; 
    missedDoses: number;
    status: 'good' | 'warning' | 'critical';
  }>) => ({
    subject: `Daily Patient Report - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏥 MedTrack</h1>
            <h2 style="color: #374151; margin: 10px 0 0 0; font-weight: normal;">Daily Patient Report</h2>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Good morning, <strong>Dr. ${doctorName}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Here's your daily summary of patient medication adherence:
          </p>
          
          <div style="margin: 30px 0;">
            ${patientReports.map(patient => {
              const statusColor = patient.status === 'good' ? '#10b981' : patient.status === 'warning' ? '#f59e0b' : '#ef4444';
              const statusIcon = patient.status === 'good' ? '✅' : patient.status === 'warning' ? '⚠️' : '🚨';
              
              return `
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${statusColor};">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">${statusIcon}</span>
                    <h3 style="color: #374151; margin: 0; font-size: 18px;">${patient.name}</h3>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-top: 10px;">
                    <div>
                      <p style="color: #6b7280; margin: 0; font-size: 12px; font-weight: bold;">STREAK</p>
                      <p style="color: #374151; margin: 0; font-size: 16px; font-weight: bold;">${patient.streakDays} days</p>
                    </div>
                    <div>
                      <p style="color: #6b7280; margin: 0; font-size: 12px; font-weight: bold;">ADHERENCE</p>
                      <p style="color: ${statusColor}; margin: 0; font-size: 16px; font-weight: bold;">${patient.adherenceRate}%</p>
                    </div>
                    <div>
                      <p style="color: #6b7280; margin: 0; font-size: 12px; font-weight: bold;">MISSED (7d)</p>
                      <p style="color: #374151; margin: 0; font-size: 16px; font-weight: bold;">${patient.missedDoses}</p>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #0369a1; margin: 0; font-size: 14px; text-align: center;">
              📊 Patients needing attention are highlighted above. Consider reaching out to patients with low adherence rates.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/doctor" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Full Dashboard
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            This report is generated daily at 8:00 AM. Customize your notification preferences in your dashboard.
          </p>
        </div>
      </div>
    `
  })
};