// components/patient/cards/HealthOverviewCard.tsx
'use client';
import { useState } from 'react';
import AppointmentBooking from '../AppointmentBooking';

export default function HealthOverviewCard() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleAppointmentSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-xl font-semibold text-slate-900">Book Appointment</div>
      <p className="text-sm text-slate-600 mb-4">Schedule a consultation with your assigned doctor</p>
      
      <AppointmentBooking onSuccess={handleAppointmentSuccess} />
    </div>
  );
}
