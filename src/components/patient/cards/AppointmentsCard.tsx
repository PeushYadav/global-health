// components/patient/cards/AppointmentsCard.tsx
'use client';
import { useEffect, useState } from 'react';

export default function AppointmentsCard() {
  const [items,setItems]=useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for appointment updates
  useEffect(() => {
    const handleAppointmentUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('appointmentBooked', handleAppointmentUpdate);
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentUpdate);
    };
  }, []);

  useEffect(()=>{(async()=>{
    const r=await fetch('/api/patient/appointments', { cache: 'no-store' });
    if(r.ok) {
      const appointments = await r.json();
      // Filter upcoming appointments and sort by date
      const upcomingAppointments = appointments
        .filter((a: any) => a.status === 'upcoming' && new Date(a.when) > new Date())
        .sort((a: any, b: any) => new Date(a.when).getTime() - new Date(b.when).getTime());
      setItems(upcomingAppointments);
    }
  })();},[refreshKey]);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-lg font-semibold text-slate-900">Your Appointments</div>
      {items.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <p className="text-sm">No upcoming appointments</p>
          <p className="text-xs mt-1">Book an appointment from the Health Overview section</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.slice(0,3).map((a,i)=>(
            <li key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{a.doctorName || 'Doctor'}</div>
                  <div className="text-xs text-slate-600">{new Date(a.when).toLocaleDateString()} at {new Date(a.when).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  {a.location && <div className="text-xs text-slate-600">{a.location}</div>}
                  {a.reason && <div className="text-xs text-slate-600 mt-0.5 italic">{a.reason}</div>}
                </div>
                <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {a.status}
                </div>
              </div>
            </li>
          ))}
          {items.length > 3 && (
            <li className="text-center">
              <div className="text-xs text-slate-500">+{items.length - 3} more appointments</div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
