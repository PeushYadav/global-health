// app/api/patient/appointments/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth')?.value;
    if (!token) return null;
    
    const { payload } = await jwtVerify(token, SECRET);
    return String(payload.sub || '');
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointments = await Appointment.find({ patient: userId })
      .select('doctorName when reason location status')
      .sort({ when: 1 })
      .lean();

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { doctorName, when, reason, location } = body;

    if (!doctorName || !when || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate appointment date is not in the past
    const appointmentDate = new Date(when);
    const now = new Date();
    
    if (appointmentDate <= now) {
      return NextResponse.json({ error: 'Appointment date must be in the future' }, { status: 400 });
    }

    // Check for existing appointment at the same time
    const existingAppointment = await Appointment.findOne({
      patient: userId,
      when: appointmentDate,
      status: { $in: ['upcoming'] }
    });

    if (existingAppointment) {
      return NextResponse.json({ error: 'You already have an appointment at this time' }, { status: 409 });
    }

    const newAppointment = await Appointment.create({
      patient: userId,
      doctorName: String(doctorName).trim(),
      when: appointmentDate,
      reason: String(reason).trim(),
      location: String(location || 'Medical Center').trim(),
      status: 'upcoming'
    });

    return NextResponse.json({
      message: 'Appointment booked successfully',
      appointment: {
        id: newAppointment._id,
        doctorName: newAppointment.doctorName,
        when: newAppointment.when,
        reason: newAppointment.reason,
        location: newAppointment.location,
        status: newAppointment.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}