// components/doctor/AppointmentsPanel.tsx
'use client';
import { useEffect, useState } from 'react';

interface Appointment {
  id: string;
  patient?: { name: string; email: string };
  when: string;
  reason?: string;
  location?: string;
  status: 'pending' | 'upcoming' | 'completed' | 'cancelled';
}

export default function AppointmentsPanel() {
  const [pending, setPending] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [rescheduleModal, setRescheduleModal] = useState<{ show: boolean; appointment: Appointment | null }>({
    show: false,
    appointment: null
  });
  const [newDateTime, setNewDateTime] = useState('');

  async function load() {
    const all = await fetch('/api/doctor/appointments', { cache: 'no-store' });
    if (all.ok) {
      const appointments = await all.json();
      
      // Separate pending requests from confirmed upcoming appointments
      const pendingAppts = appointments.filter((a: Appointment) => 
        a.status === 'pending' || (a.status === 'upcoming' && new Date(a.when) > new Date())
      );
      
      const upcomingAppts = appointments.filter((a: Appointment) => 
        a.status === 'upcoming' && new Date(a.when) > new Date()
      );
      
      setPending(pendingAppts);
      setUpcoming(upcomingAppts);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAppointmentAction(id: string, action: 'accept' | 'decline' | 'reschedule', newTime?: string) {
    try {
      const body: any = { id, action };
      if (action === 'reschedule' && newTime) {
        body.newTime = newTime;
      }

      const response = await fetch('/api/doctor/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await load();
        // Trigger calendar refresh
        window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        
        if (action === 'accept') {
          alert('Appointment accepted successfully!');
        } else if (action === 'decline') {
          alert('Appointment declined.');
        } else if (action === 'reschedule') {
          alert('Appointment rescheduled successfully!');
        }
      } else {
        const error = await response.json();
        alert(`Failed to ${action} appointment: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      alert(`Failed to ${action} appointment. Please try again.`);
    }
  }

  const openRescheduleModal = (appointment: Appointment) => {
    setRescheduleModal({ show: true, appointment });
    // Pre-fill with current appointment time
    const currentTime = new Date(appointment.when);
    const isoString = new Date(currentTime.getTime() - currentTime.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setNewDateTime(isoString);
  };

  const handleReschedule = async () => {
    if (!rescheduleModal.appointment || !newDateTime) {
      alert('Please select a new date and time');
      return;
    }

    await handleAppointmentAction(
      rescheduleModal.appointment.id, 
      'reschedule', 
      new Date(newDateTime).toISOString()
    );
    
    setRescheduleModal({ show: false, appointment: null });
    setNewDateTime('');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Appointment Management</h3>
        
        {/* Pending Requests Section */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-md font-medium text-slate-900">Pending Requests</h4>
            {pending.length > 0 && (
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                {pending.length}
              </span>
            )}
          </div>
          
          {pending.length === 0 ? (
            <div className="text-center py-4 text-slate-500 bg-slate-50 rounded-lg">
              <p className="text-sm">No pending appointment requests</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pending.map((appointment) => {
                const { date, time } = formatDateTime(appointment.when);
                return (
                  <li key={appointment.id} className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {appointment.patient?.name || appointment.patient?.email || 'Unknown Patient'}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          📅 {date} at {time}
                        </div>
                        <div className="text-xs text-slate-600">
                          📝 {appointment.reason || 'General consultation'}
                        </div>
                        {appointment.location && (
                          <div className="text-xs text-slate-600">
                            📍 {appointment.location}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'accept')}
                          className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => openRescheduleModal(appointment)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          🔄 Reschedule
                        </button>
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'decline')}
                          className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                        >
                          ✗ Decline
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Upcoming Confirmed Appointments */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-md font-medium text-slate-900">Confirmed Appointments</h4>
            {upcoming.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {upcoming.length}
              </span>
            )}
          </div>
          
          {upcoming.length === 0 ? (
            <div className="text-center py-4 text-slate-500 bg-slate-50 rounded-lg">
              <p className="text-sm">No confirmed upcoming appointments</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 5).map((appointment) => {
                const { date, time } = formatDateTime(appointment.when);
                return (
                  <li key={appointment.id} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {appointment.patient?.name || appointment.patient?.email || 'Unknown Patient'}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          📅 {date} at {time}
                        </div>
                        <div className="text-xs text-slate-600">
                          📝 {appointment.reason || 'General consultation'}
                        </div>
                        {appointment.location && (
                          <div className="text-xs text-slate-600">
                            📍 {appointment.location}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full text-center font-medium">
                          Confirmed
                        </div>
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'decline')}
                          className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Reschedule Appointment</h3>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                Patient: <span className="font-medium">
                  {rescheduleModal.appointment?.patient?.name || 'Unknown Patient'}
                </span>
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Current time: <span className="font-medium">
                  {rescheduleModal.appointment && formatDateTime(rescheduleModal.appointment.when).date} at{' '}
                  {rescheduleModal.appointment && formatDateTime(rescheduleModal.appointment.when).time}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Date & Time
              </label>
              <input
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReschedule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Reschedule
              </button>
              <button
                onClick={() => {
                  setRescheduleModal({ show: false, appointment: null });
                  setNewDateTime('');
                }}
                className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
