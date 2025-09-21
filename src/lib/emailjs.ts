// lib/emailjs.ts
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: 'service_jxh3u5o',
  templateId: 'template_g3saswe', 
  publicKey: 'aZzPa1SSl5c4qnLxH'
};

// Initialize EmailJS (call this once in your app)
export function initEmailJS() {
  emailjs.init(EMAILJS_CONFIG.publicKey);
  console.log('EmailJS initialized successfully');
}

// Send medication reminder email
export async function sendMedicationReminder({
  userName,
  email,
  medicineName,
  dosage,
  time,
  title = 'Medication Reminder'
}: {
  userName: string;
  email: string;
  medicineName: string;
  dosage: string;
  time: string;
  title?: string;
}) {
  try {
    // Initialize EmailJS if not already done
    emailjs.init(EMAILJS_CONFIG.publicKey);
    
    const templateParams = {
      user_name: userName,
      email: email,
      title: title,
      medicine_name: medicineName,
      dosage: dosage,
      time: time,
      // Additional template variables for better emails
      app_name: 'MedTrack Health',
      current_date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      dashboard_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'
    };

    console.log('Sending medication reminder email:', {
      to: email,
      medicine: medicineName,
      time: time
    });

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log('Email sent successfully:', result);
    return {
      success: true,
      messageId: result.text,
      status: result.status
    };

  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
}

// Send multiple medication reminders for a patient
export async function sendDailyMedicationReminders({
  userName,
  email,
  medications
}: {
  userName: string;
  email: string;
  medications: Array<{
    name: string;
    dosage: string;
    timing: string;
  }>;
}) {
  const results = [];
  
  // Send a reminder for each medication
  for (const medication of medications) {
    const result = await sendMedicationReminder({
      userName,
      email,
      medicineName: medication.name,
      dosage: medication.dosage,
      time: medication.timing,
      title: `Time for your ${medication.name}`
    });
    
    results.push({
      medication: medication.name,
      ...result
    });
    
    // Add small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Generic email sending function for other types of notifications
export async function sendNotificationEmail({
  userName,
  email,
  subject,
  message,
  actionUrl
}: {
  userName: string;
  email: string;
  subject: string;
  message: string;
  actionUrl?: string;
}) {
  try {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    
    const templateParams = {
      user_name: userName,
      email: email,
      title: subject,
      medicine_name: message, // Using medicine_name field for generic message
      dosage: actionUrl || '', // Using dosage field for action URL
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      app_name: 'MedTrack Health',
      current_date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    return {
      success: true,
      messageId: result.text,
      status: result.status
    };

  } catch (error) {
    console.error('Failed to send notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test EmailJS connection
export async function testEmailConnection(testEmail: string) {
  return await sendMedicationReminder({
    userName: 'Test User',
    email: testEmail,
    medicineName: 'Test Medicine',
    dosage: '100mg',
    time: '8:00 AM',
    title: 'EmailJS Test - System Working!'
  });
}