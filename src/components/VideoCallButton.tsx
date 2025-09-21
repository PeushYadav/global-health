// components/VideoCallButton.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VideoCallButtonProps {
  appointmentId?: string;
  participantName?: string;
  appointmentReason?: string;
  isAppointment?: boolean;
  disabled?: boolean;
  className?: string;
  userRole: 'doctor' | 'patient';
}

/**
 * Generates a unique room ID for video calls
 */
const generateRoomId = (appointmentId?: string): string => {
  if (appointmentId) {
    return `appointment_${appointmentId}_${Date.now()}`;
  }
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Gets the appropriate call route based on user role
 */
const getCallRoute = (userRole: 'doctor' | 'patient', roomId: string): string => {
  return `/${userRole}/call?roomId=${roomId}`;
};

export default function VideoCallButton({
  appointmentId,
  participantName,
  appointmentReason,
  isAppointment = false,
  disabled = false,
  className = '',
  userRole
}: VideoCallButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const initiateCall = () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      const roomId = generateRoomId(appointmentId);
      const callRoute = getCallRoute(userRole, roomId);
      
      router.push(callRoute);
    } catch (err) {
      setError('Failed to start video call');
      console.error('Video call error:', err);
      setIsLoading(false);
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-sm
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const variantClasses = disabled
    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md';

  return (
    <div className="relative">
      <button
        onClick={initiateCall}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses} ${className}`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Starting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {isAppointment ? 'Start Appointment' : 'Video Call'}
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-md text-sm text-red-700 whitespace-nowrap z-10">
          {error}
        </div>
      )}

      {/* Call info tooltip */}
      {(participantName || appointmentReason) && !isLoading && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {isAppointment && appointmentReason && (
              <div>Appointment: {appointmentReason}</div>
            )}
            {participantName && (
              <div>With: {participantName}</div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for use in lists/tables
export function CompactVideoCallButton({
  appointmentId,
  participantName,
  disabled = false,
  userRole
}: Omit<VideoCallButtonProps, 'className' | 'isAppointment' | 'appointmentReason'>) {
  return (
    <VideoCallButton
      appointmentId={appointmentId}
      participantName={participantName}
      disabled={disabled}
      userRole={userRole}
      className="px-3 py-1 text-xs"
    />
  );
}

// Large version for appointment cards
export function LargeVideoCallButton({
  appointmentId,
  participantName,
  appointmentReason,
  disabled = false,
  userRole
}: Omit<VideoCallButtonProps, 'className'>) {
  return (
    <VideoCallButton
      appointmentId={appointmentId}
      participantName={participantName}
      appointmentReason={appointmentReason}
      isAppointment={true}
      disabled={disabled}
      userRole={userRole}
      className="px-6 py-3 text-base w-full sm:w-auto"
    />
  );
}