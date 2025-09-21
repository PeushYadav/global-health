// app/api/patient/medication/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { MedicalProfile } from '@/models/MedicalProfile';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getUid() {
  const cookieStore = await cookies();
  const t = cookieStore.get('auth')?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, SECRET);
    return String(payload.sub || '');
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const userId = await getUid();
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, dosage, timing } = await req.json();

    // Validate input
    if (!name || !dosage || !timing) {
      return NextResponse.json({ 
        message: 'Missing required fields: name, dosage, and timing are required' 
      }, { status: 400 });
    }

    // Trim and validate the inputs
    const medicationData = {
      name: name.trim(),
      dosage: dosage.trim(),
      timing: timing.trim()
    };

    if (!medicationData.name || !medicationData.dosage || !medicationData.timing) {
      return NextResponse.json({ 
        message: 'Fields cannot be empty' 
      }, { status: 400 });
    }

    // Find or create the medical profile
    let medicalProfile = await MedicalProfile.findOne({ user: userId });
    
    if (!medicalProfile) {
      // Create new medical profile if it doesn't exist
      medicalProfile = new MedicalProfile({
        user: userId,
        medications: [medicationData]
      });
    } else {
      // Check if medication already exists (by name, case-insensitive)
      const existingMed = medicalProfile.medications?.find(
        (med: any) => med.name.toLowerCase() === medicationData.name.toLowerCase()
      );

      if (existingMed) {
        return NextResponse.json({ 
          message: 'Medication with this name already exists' 
        }, { status: 400 });
      }

      // Add new medication to existing profile
      if (!medicalProfile.medications) {
        medicalProfile.medications = [];
      }
      medicalProfile.medications.push(medicationData);
    }

    await medicalProfile.save();

    return NextResponse.json({ 
      message: 'Medication added successfully',
      medication: medicationData
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding medication:', error);
    return NextResponse.json({ 
      message: 'Failed to add medication' 
    }, { status: 500 });
  }
}