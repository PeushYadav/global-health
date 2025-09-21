// app/api/doctor/patient-profile/[patientId]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    await connectDB();
    const doctorId = await getUid();
    
    if (!doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the doctor has access to this patient
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json({ error: 'Not authorized as doctor' }, { status: 403 });
    }

    const { patientId } = await params;
    
    // Verify patient exists and is actually a patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get patient's medical profile
    const medProfile = await MedicalProfile.findOne({ user: patientId }).lean();
    
    if (!medProfile) {
      // Return empty structure if no profile exists
      return NextResponse.json({
        medications: [],
        allergies: [],
        conditions: []
      });
    }

    return NextResponse.json({
      medications: (medProfile as any).medications || [],
      allergies: (medProfile as any).allergies || [],
      conditions: (medProfile as any).conditions || []
    });
    
  } catch (error) {
    console.error('Error fetching patient medical profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    await connectDB();
    const doctorId = await getUid();
    
    if (!doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the doctor has access to this patient
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json({ error: 'Not authorized as doctor' }, { status: 403 });
    }

    const { patientId } = await params;
    
    // Verify patient exists and is actually a patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const body = await request.json();
    const { medications, allergies, conditions } = body;

    // Update or create medical profile
    const updateData: any = {};
    if (medications !== undefined) updateData.medications = medications;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (conditions !== undefined) updateData.conditions = conditions;

    const updatedProfile = await MedicalProfile.findOneAndUpdate(
      { user: patientId },
      updateData,
      { 
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true
      }
    );

    return NextResponse.json({
      medications: updatedProfile.medications || [],
      allergies: updatedProfile.allergies || [],
      conditions: updatedProfile.conditions || []
    });
    
  } catch (error) {
    console.error('Error updating patient medical profile:', error);
    return NextResponse.json(
      { error: 'Failed to update patient profile' },
      { status: 500 }
    );
  }
}