// app/api/doctor/appointments/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
import { User } from '@/models/User';
import { MedicalProfile } from '@/models/MedicalProfile';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getDoctorId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth')?.value;
    if (!token) return null;
    
    const { payload } = await jwtVerify(token, SECRET);
    if ((payload as any).role !== 'doctor') return null;
    return String(payload.sub || '');
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const doctorId = await getDoctorId();
    if (!doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get doctor's information
    const doctor = await User.findById(doctorId).select('name email');
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Find appointments with this doctor (by doctorName matching)
    let query: any = {
      $or: [
        { doctorName: doctor.name },
        { doctorName: { $regex: new RegExp(doctor.email.split('@')[0], 'i') } }
      ]
    };

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email')
      .select('patient doctorName when reason location status')
      .sort({ when: 1 })
      .lean();

    const formattedAppointments = appointments.map((apt: any) => ({
      id: apt._id,
      patient: apt.patient ? {
        id: apt.patient._id,
        name: apt.patient.name,
        email: apt.patient.email
      } : null,
      doctorName: apt.doctorName,
      when: apt.when,
      reason: apt.reason,
      location: apt.location,
      status: apt.status
    }));

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const doctorId = await getDoctorId();
    if (!doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing appointment ID or action' }, { status: 400 });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Update appointment status based on action
    let newStatus = 'upcoming';
    if (action === 'accept') {
      newStatus = 'upcoming';
    } else if (action === 'decline') {
      newStatus = 'cancelled';
    }

    await Appointment.findByIdAndUpdate(id, { status: newStatus });

    return NextResponse.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}