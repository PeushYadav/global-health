// app/api/notifications/medication-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { MedicalProfile } from '@/models/MedicalProfile';
import { sendMedicationReminder, sendDailyMedicationReminders } from '@/lib/emailjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { patientId, medicationName } = await request.json();
    
    // If specific patient and medication provided, send targeted reminder
    if (patientId && medicationName) {
      const patient = await User.findById(patientId);
      const medicalProfile = await MedicalProfile.findOne({ user: patientId });
      
      if (!patient || !medicalProfile) {
        return NextResponse.json(
          { error: 'Patient or medical profile not found' },
          { status: 404 }
        );
      }

      const medication = medicalProfile.medications?.find(
        (med: any) => med.name.toLowerCase().includes(medicationName.toLowerCase())
      );

      if (!medication) {
        return NextResponse.json(
          { error: 'Medication not found' },
          { status: 404 }
        );
      }

      const result = await sendMedicationReminder({
        userName: patient.name,
        email: patient.email,
        medicineName: medication.name,
        dosage: medication.dosage,
        time: medication.timing
      });

      return NextResponse.json({
        success: true,
        message: 'Medication reminder sent',
        patient: patient.name,
        medication: medication.name,
        result
      });
    }

    // Send reminders to all patients with pending medications
    const medicalProfiles = await MedicalProfile.find({
      'medications.0': { $exists: true }
    }).populate('user');

    const results = [];
    const currentHour = new Date().getHours();

    for (const profile of medicalProfiles) {
      const patient = profile.user as any;
      
      if (!patient || !patient.email) continue;

      // Check if patient has medications due around this time
      const dueMedications = profile.medications?.filter((med: any) => {
        if (!med.timing) return false;
        
        // Parse timing (e.g., "8:00 AM", "Morning", "2x daily")
        const timing = med.timing.toLowerCase();
        
        if (timing.includes('morning') || timing.includes('8:00') || timing.includes('9:00')) {
          return currentHour >= 7 && currentHour <= 10;
        }
        if (timing.includes('afternoon') || timing.includes('12:00') || timing.includes('1:00') || timing.includes('2:00')) {
          return currentHour >= 11 && currentHour <= 14;
        }
        if (timing.includes('evening') || timing.includes('6:00') || timing.includes('7:00') || timing.includes('8:00')) {
          return currentHour >= 17 && currentHour <= 20;
        }
        if (timing.includes('night') || timing.includes('10:00') || timing.includes('11:00')) {
          return currentHour >= 21 || currentHour <= 1;
        }
        
        return false;
      }) || [];

      if (dueMedications.length > 0) {
        // Send all due medications in batch for this patient
        const medicationData = dueMedications.map((med: any) => ({
          name: med.name,
          dosage: med.dosage,
          timing: med.timing
        }));

        try {
          const batchResults = await sendDailyMedicationReminders({
            userName: patient.name,
            email: patient.email,
            medications: medicationData
          });

          results.push({
            patient: patient.name,
            email: patient.email,
            medicationsCount: dueMedications.length,
            status: 'sent',
            results: batchResults
          });
        } catch (error) {
          results.push({
            patient: patient.name,
            email: patient.email,
            medicationsCount: dueMedications.length,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed medication reminders for ${results.length} patients`,
      currentHour,
      results
    });

  } catch (error) {
    console.error('Medication reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to send medication reminders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}