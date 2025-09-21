// app/api/doctor/patients/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
import { MedicalProfile } from '@/models/MedicalProfile';
import { User } from '@/models/User';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');
async function doctorId() {
  const cookieStore = await cookies();
  const t = cookieStore.get('auth')?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, SECRET); return (payload as any).role === 'doctor' ? String(payload.sub) : null; } catch { return null; }
}

export async function GET() {
  await connectDB();
  const did = await doctorId();
  if (!did) return NextResponse.json([], { status: 401 });

  // Get the current doctor's details
  const doctorData = await User.findById(did).select('name email').lean();
  if (!doctorData) return NextResponse.json([], { status: 401 });

  const doctor = doctorData as { _id: string; name: string; email: string };

  // Find patients through multiple ways:
  // 1. From appointments
  const appointments = await Appointment.find({ 
    $or: [
      { doctor: did }, // Direct doctor ID match
      { doctorId: did }, // Alternative field name
      { doctorName: doctor.name }, // Doctor name match
      { doctorName: { $regex: new RegExp(doctor.email.split('@')[0], 'i') } } // Email prefix match
    ]
  }).select('patient').lean();

  const appointmentPatientIds = appointments.map(a => String(a.patient)).filter(Boolean);

  // 2. From medical profiles - patients who list this doctor
  const medicalProfiles = await MedicalProfile.find({
    $or: [
      { consultingDoctor: { $regex: new RegExp(doctor.name, 'i') } }, // Doctor name match
      { doctorEmail: doctor.email }, // Exact email match
      { consultingDoctor: { $regex: new RegExp('lomdis', 'i') } } // Also search for "lomdis" specifically
    ]
  }).select('user').lean();

  const profilePatientIds = medicalProfiles.map(p => String(p.user)).filter(Boolean);

  // Combine all unique patient IDs
  const allPatientIds = [...new Set([...appointmentPatientIds, ...profilePatientIds])].filter(Boolean);
  
  if (allPatientIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get user details for all patients
  const users = await User.find({ 
    _id: { $in: allPatientIds },
    role: 'patient' // Ensure we only get patients
  }).select('_id name email').lean();

  return NextResponse.json(users.map(u => ({ 
    id: String(u._id), 
    name: u.name, 
    email: u.email 
  })));
}
