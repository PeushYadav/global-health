// app/api/video-call/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Appointment } from '@/models/Appointment';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let currentUserId: string;
    try {
      const { payload } = await jwtVerify(token, SECRET);
      currentUserId = payload.sub as string;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { appointmentId, participantId } = await request.json();

    console.log('Video call request:', {
      appointmentId,
      participantId,
      currentUserId,
      userRole: currentUser.role
    });

    if (!appointmentId && !participantId) {
      return NextResponse.json({ 
        error: 'Either appointmentId or participantId is required' 
      }, { status: 400 });
    }

    let appointment = null;
    let otherParticipant = null;

    // If appointmentId provided, validate appointment
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
      
      console.log('Found appointment:', {
        appointmentId,
        found: !!appointment,
        doctor: appointment?.doctor?.toString(),
        patient: appointment?.patient?.toString(),
        currentUserId
      });
      
      if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      // Check if current user is part of this appointment
      const isDoctor = appointment.doctor?.toString() === currentUserId;
      const isPatient = appointment.patient?.toString() === currentUserId;

      console.log('Authorization check:', {
        isDoctor,
        isPatient,
        doctorId: appointment.doctor?.toString(),
        patientId: appointment.patient?.toString(),
        currentUserId
      });

      if (!isDoctor && !isPatient) {
        return NextResponse.json({ 
          error: 'You are not authorized for this appointment' 
        }, { status: 403 });
      }

      // Get the other participant
      if (isDoctor) {
        otherParticipant = await User.findById(appointment.patient);
      } else {
        otherParticipant = await User.findById(appointment.doctor);
      }
    } else {
      // Direct participant call
      otherParticipant = await User.findById(participantId);
    }

    if (!otherParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Generate unique room ID for this call
    const roomId = `call_${appointmentId || 'direct'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create call session data
    const callSession = {
      roomId,
      initiator: {
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role
      },
      participant: {
        id: otherParticipant._id,
        name: otherParticipant.name,
        email: otherParticipant.email,
        role: otherParticipant.role
      },
      appointment: appointment ? {
        id: appointment._id,
        reason: appointment.reason,
        when: appointment.when,
        status: appointment.status
      } : null,
      createdAt: new Date().toISOString(),
      status: 'initiated'
    };

    // Update appointment status if applicable
    if (appointment) {
      appointment.status = 'in-progress';
      appointment.callStarted = new Date();
      appointment.callRoomId = roomId;
      await appointment.save();
    }

    // Determine role-specific redirect URLs
    const initiatorRedirectUrl = currentUser.role === 'doctor' 
      ? `/doctor/call?roomId=${roomId}` 
      : `/patient/call?roomId=${roomId}`;
    
    const participantCallUrl = otherParticipant.role === 'doctor'
      ? `/doctor/call?roomId=${roomId}`
      : `/patient/call?roomId=${roomId}`;

    return NextResponse.json({
      success: true,
      message: 'Video call initiated successfully',
      callSession,
      redirectUrl: initiatorRedirectUrl,
      notifyParticipant: {
        userId: otherParticipant._id,
        message: `${currentUser.name} is starting a video call`,
        callUrl: participantCallUrl,
        appointmentContext: appointment ? true : false
      }
    });

  } catch (error) {
    console.error('Video call initiation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate video call', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Get active call sessions for a user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let currentUserId: string;
    try {
      const { payload } = await jwtVerify(token, SECRET);
      currentUserId = payload.sub as string;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find active appointments with call room IDs
    const activeCallAppointments = await Appointment.find({
      $or: [
        { doctor: currentUserId },
        { patient: currentUserId }
      ],
      callRoomId: { $exists: true },
      status: 'in-progress',
      callStarted: { 
        $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Within last 2 hours
      }
    }).populate('doctor patient');

    const activeCalls = activeCallAppointments.map(appointment => ({
      roomId: appointment.callRoomId,
      appointmentId: appointment._id,
      reason: appointment.reason,
      startTime: appointment.callStarted,
      doctor: {
        id: appointment.doctor._id,
        name: appointment.doctor.name,
        email: appointment.doctor.email
      },
      patient: {
        id: appointment.patient._id,
        name: appointment.patient.name,
        email: appointment.patient.email
      },
      isCurrentUserDoctor: appointment.doctor._id.toString() === currentUserId
    }));

    return NextResponse.json({
      success: true,
      activeCalls,
      count: activeCalls.length
    });

  } catch (error) {
    console.error('Get active calls error:', error);
    return NextResponse.json(
      { error: 'Failed to get active calls' },
      { status: 500 }
    );
  }
}