// components/CallNotification.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CallNotificationProps {
  isVisible: boolean;
  callerName: string;
  callerRole: string;
  appointmentReason?: string;
  roomId: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function CallNotification({
  isVisible,
  callerName,
  callerRole,
  appointmentReason,
  roomId,
  onAccept,
  onDecline
}: CallNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(30); // 30 second timeout
  const router = useRouter();

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDecline(); // Auto-decline when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onDecline]);

  const handleAccept = () => {
    onAccept();
    router.push(`/video-call/${roomId}`);
  };

  const handleDecline = () => {
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Incoming Video Call</h3>
              <p className="text-blue-100 text-sm">
                {callerRole === 'doctor' ? 'Dr.' : ''} {callerName}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {appointmentReason && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Appointment</p>
              <p className="font-medium text-gray-900">{appointmentReason}</p>
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">
              {callerRole === 'doctor' ? 'Your doctor' : callerName} is starting a video call
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Auto-decline in {timeLeft}s</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleDecline}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>Accept</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-red-500 transition-all duration-1000 ease-linear"
            style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Hook for managing call notifications
export function useCallNotifications() {
  const [notification, setNotification] = useState(null);

  const showNotification = (callData: any) => {
    setNotification(callData);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const acceptCall = () => {
    if (notification) {
      // Handle call acceptance logic here
      console.log('Accepting call:', notification);
      hideNotification();
    }
  };

  const declineCall = () => {
    if (notification) {
      // Handle call decline logic here
      console.log('Declining call:', notification);
      hideNotification();
    }
  };

  return {
    notification,
    showNotification,
    hideNotification,
    acceptCall,
    declineCall
  };
}