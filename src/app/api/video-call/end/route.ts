// app/api/video-call/end/route.ts
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

    const { roomId, appointmentId, duration } = await request.json();

    if (!roomId && !appointmentId) {
      return NextResponse.json({ 
        error: 'Either roomId or appointmentId is required' 
      }, { status: 400 });
    }

    let appointment = null;

    // Find appointment by roomId or appointmentId
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
    } else if (roomId) {
      appointment = await Appointment.findOne({ callRoomId: roomId });
    }

    if (appointment) {
      // Verify user has permission to end this call
      const isDoctor = appointment.doctor?.toString() === currentUserId;
      const isPatient = appointment.patient?.toString() === currentUserId;

      if (!isDoctor && !isPatient) {
        return NextResponse.json({ 
          error: 'You are not authorized to end this call' 
        }, { status: 403 });
      }

      // Update appointment with call completion
      appointment.status = 'completed';
      appointment.callEnded = new Date();
      
      if (appointment.callStarted && duration) {
        appointment.callDuration = duration;
      } else if (appointment.callStarted) {
        const startTime = new Date(appointment.callStarted).getTime();
        const endTime = new Date().getTime();
        appointment.callDuration = Math.round((endTime - startTime) / 1000); // Duration in seconds
      }

      // Clear call room ID
      appointment.callRoomId = undefined;
      
      await appointment.save();

      return NextResponse.json({
        success: true,
        message: 'Video call ended successfully',
        appointment: {
          id: appointment._id,
          status: appointment.status,
          duration: appointment.callDuration,
          startTime: appointment.callStarted,
          endTime: appointment.callEnded
        }
      });
    } else {
      // Handle direct calls (no appointment)
      return NextResponse.json({
        success: true,
        message: 'Direct video call ended successfully',
        roomId
      });
    }

  } catch (error) {
    console.error('Video call end error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to end video call', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}