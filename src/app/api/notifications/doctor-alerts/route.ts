// app/api/notifications/doctor-alerts/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { MedicalProfile } from '@/models/MedicalProfile';
import { DailyLog } from '@/models/DailyLog';
import { Appointment } from '@/models/Appointment';
import { sendNotificationEmail } from '@/lib/emailjs';
import { ymdLocal } from '@/utils/date';

// Helper function to get doctor's patients and their adherence data
async function getDoctorPatientReports(doctorId: string) {
  const doctor = await User.findById(doctorId).select('name email').lean() as any;
  if (!doctor) return null;

  // Find patients associated with this doctor through appointments and medical profiles
  const appointments = await Appointment.find({ 
    $or: [
      { doctor: doctorId },
      { doctorId: doctorId },
      { doctorName: doctor.name },
      { doctorName: { $regex: new RegExp(doctor.email.split('@')[0], 'i') } }
    ]
  }).select('patient').lean();

  const medicalProfiles = await MedicalProfile.find({
    $or: [
      { consultingDoctor: { $regex: new RegExp(doctor.name, 'i') } },
      { doctorEmail: doctor.email }
    ]
  }).select('user').lean();

  const appointmentPatientIds = appointments.map(a => String((a as any).patient)).filter(Boolean);
  const profilePatientIds = medicalProfiles.map(p => String((p as any).user)).filter(Boolean);
  const allPatientIds = [...new Set([...appointmentPatientIds, ...profilePatientIds])];

  if (allPatientIds.length === 0) return null;

  // Get patient details and calculate their adherence
  const patients = await User.find({ 
    _id: { $in: allPatientIds },
    role: 'patient'
  }).select('_id name email').lean();

  const patientReports = [];
  const today = new Date();
  const last7Days = [];
  
  // Get last 7 days for analysis
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    last7Days.push(ymdLocal(date));
  }

  for (const patient of patients) {
    const patientData = patient as any;
    const patientId = String(patientData._id);
    
    // Get patient's medications
    const profile = await MedicalProfile.findOne({ user: patientId }).lean() as any;
    if (!profile || !profile.medications || profile.medications.length === 0) {
      continue;
    }

    // Get medication logs for last 7 days
    const logs = await DailyLog.find({
      user: patientId,
      date: { $in: last7Days }
    }).lean();

    const logMap = new Map(logs.map(log => [(log as any).date, log]));
    
    let totalTaken = 0;
    let missedDoses = 0;
    let currentStreak = 0;
    const totalExpected = last7Days.length * profile.medications.length;

    // Calculate adherence metrics
    for (let i = 0; i < last7Days.length; i++) {
      const date = last7Days[i];
      const log = logMap.get(date) as any;
      
      if (log && log.medicationsTaken && log.medicationsTaken.length > 0) {
        const takenToday = log.medicationsTaken.filter((med: any) => med.taken).length;
        totalTaken += takenToday;
        
        if (takenToday >= profile.medications.length) {
          if (i === 0 || currentStreak === i) {
            currentStreak = i + 1;
          }
        } else {
          missedDoses += (profile.medications.length - takenToday);
        }
      } else {
        missedDoses += profile.medications.length;
      }
    }

    const adherenceRate = Math.round((totalTaken / totalExpected) * 100);
    
    // Determine patient status
    let status: 'good' | 'warning' | 'critical';
    if (adherenceRate >= 90) status = 'good';
    else if (adherenceRate >= 70) status = 'warning';
    else status = 'critical';

    patientReports.push({
      name: patientData.name || patientData.email.split('@')[0],
      streakDays: currentStreak,
      adherenceRate,
      missedDoses,
      status
    });
  }

  return {
    doctor,
    patientReports: patientReports.sort((a, b) => {
      // Sort by status (critical first) then by adherence rate
      const statusOrder = { critical: 0, warning: 1, good: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.adherenceRate - b.adherenceRate;
    })
  };
}

export async function POST() {
  try {
    await connectDB();
    
    // Get all doctors
    const doctors = await User.find({ role: 'doctor' }).select('_id name email').lean();
    const sentEmails = [];
    const errors = [];

    for (const doctorData of doctors) {
      try {
        const doctor = doctorData as any;
        const reportData = await getDoctorPatientReports(String(doctor._id));
        
        if (!reportData || reportData.patientReports.length === 0) {
          continue; // Skip doctors with no patients or data
        }

        // Only send if there are patients needing attention (warning or critical)
        const patientsNeedingAttention = reportData.patientReports.filter(p => 
          p.status === 'warning' || p.status === 'critical'
        );

        if (patientsNeedingAttention.length === 0) {
          continue; // Skip if all patients are doing well
        }

        // Generate doctor alert message
        const criticalPatients = patientsNeedingAttention.filter(p => p.status === 'critical').length;
        const warningPatients = patientsNeedingAttention.filter(p => p.status === 'warning').length;
        
        const subject = `Patient Adherence Alert - ${criticalPatients} Critical, ${warningPatients} Warning`;
        
        // Create a summary of patients needing attention
        const patientSummary = patientsNeedingAttention.map(patient => 
          `${patient.name}: ${patient.adherenceRate}% adherence (${patient.status})`
        ).join(', ');
        
        const message = `Dear Dr. ${reportData.doctor.name || 'Doctor'}, you have ${patientsNeedingAttention.length} patients requiring attention: ${patientSummary}. Please review their medication adherence and consider follow-up consultations.`;

        // Send email using EmailJS
        const result = await sendNotificationEmail({
          userName: reportData.doctor.name || 'Doctor',
          email: doctor.email,
          subject: subject,
          message: message,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/doctor`
        });

        if (result.success) {
          sentEmails.push({
            doctorId: doctor._id,
            doctorEmail: doctor.email,
            messageId: result.messageId,
            patientsReported: reportData.patientReports.length,
            patientsNeedingAttention: patientsNeedingAttention.length
          });
        } else {
          errors.push({
            doctorId: doctor._id,
            doctorEmail: doctor.email,
            error: result.error
          });
        }
      } catch (error) {
        errors.push({
          doctorId: (doctorData as any)._id,
          doctorEmail: (doctorData as any).email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Doctor patient alerts processed`,
      stats: {
        totalDoctors: doctors.length,
        emailsSent: sentEmails.length,
        errors: errors.length
      },
      sentEmails,
      errors
    });

  } catch (error) {
    console.error('Doctor patient alerts job failed:', error);
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
    message: 'Doctor patient alert service is active',
    endpoint: 'POST /api/notifications/doctor-alerts',
    description: 'Sends daily patient condition reports to doctors about medication adherence'
  });
}