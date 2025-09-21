// components/patient/AppointmentBooking.tsx
'use client';
import { useState, useEffect } from 'react';

interface AppointmentBookingProps {
  onSuccess?: () => void;
}

export default function AppointmentBooking({ onSuccess }: AppointmentBookingProps) {
  const [doctorName, setDoctorName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  
  // Get maximum date (6 months from now)
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())
    .toISOString().split('T')[0];

  // Time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  useEffect(() => {
    // Fetch doctor name from medical profile
    const fetchDoctorName = async () => {
      try {
        const response = await fetch('/api/patient/profile');
        if (response.ok) {
          const profile = await response.json();
          setDoctorName(profile.consultingDoctor || 'Your Doctor');
          setLocation(profile.doctorLocation || 'Medical Center');
        }
      } catch (error) {
        console.error('Failed to fetch doctor name:', error);
      }
    };

    fetchDoctorName();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !reason.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      const response = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorName,
          when: appointmentDateTime.toISOString(),
          reason: reason.trim(),
          location: location.trim() || 'Medical Center',
        }),
      });

      if (response.ok) {
        // Reset form
        setSelectedDate('');
        setSelectedTime('');
        setReason('');
        setShowForm(false);
        
        // Trigger calendar refresh
        window.dispatchEvent(new CustomEvent('appointmentBooked'));
        
        alert('Appointment booked successfully!');
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(`Failed to book appointment: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-200">
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Book Appointment with {doctorName}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <div className="mb-3">
        <h4 className="text-sm font-medium text-slate-900">Book Appointment</h4>
        <p className="text-xs text-slate-600">Schedule with {doctorName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Time *
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Reason for Visit *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Follow-up, Check-up, Lab results"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Medical Center"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Booking...' : 'Book Appointment'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}