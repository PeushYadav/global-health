// components/doctors/DoctorCalendarCard.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { TZ, ymdLocal, headerLocal } from '@/utils/date';

export default function DoctorCalendarCard() {
  const [appts, setAppts] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Deterministic "today" snapshot; rendering uses TZ-aware helpers
  const today = useMemo(() => new Date(), []);
  useEffect(() => setMounted(true), []);

  // Add refresh function that can be called from parent
  const refreshCalendar = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Listen to custom events for updates
  useEffect(() => {
    const handleAppointmentUpdate = () => {
      refreshCalendar();
    };

    window.addEventListener('appointmentBooked', handleAppointmentUpdate);
    window.addEventListener('appointmentUpdated', handleAppointmentUpdate);
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentUpdate);
      window.removeEventListener('appointmentUpdated', handleAppointmentUpdate);
    };
  }, []);

  useEffect(() => {
    (async () => {
      // Fetch doctor's appointments
      const a = await fetch('/api/doctor/appointments', { cache: 'no-store' });
      if (a.ok) {
        const arr = await a.json();
        // Get all upcoming appointments and map to dates
        const upcomingAppts = arr
          .filter((x: any) => x.status === 'upcoming' && new Date(x.when) >= today)
          .map((x: any) => ymdLocal(new Date(x.when)));
        setAppts(upcomingAppts);
      }
    })();
  }, [refreshKey, today]);

  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1));

  const apptSet = useMemo(() => new Set(appts), [appts]);
  const header = headerLocal(today);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Appointment Calendar</h3>
        <button
          onClick={refreshCalendar}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          title="Refresh calendar"
        >
          🔄
        </button>
      </div>
      
      {/* suppressHydrationWarning avoids noisy console if extensions tweak DOM */}
      <div className="mb-3 text-sm text-slate-600" suppressHydrationWarning>
        {mounted ? header : ''}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const key = ymdLocal(d);
          const hasAppt = apptSet.has(key);
          const isToday = key === ymdLocal(new Date());
          const isPast = d < today && !isToday;
          
          // Determine the styling based on date status
          let bgClass = 'border-slate-200 bg-white text-slate-900';
          
          if (isPast) {
            bgClass = 'border-slate-200 bg-slate-50 text-slate-400';
          } else if (isToday) {
            bgClass = 'border-blue-600 bg-blue-100 text-blue-900 font-semibold';
          } else if (hasAppt) {
            bgClass = 'border-green-600 bg-green-100 text-green-900 font-medium';
          }
          
          return (
            <div
              key={i}
              className={`aspect-square rounded-full border text-center text-sm leading-[2.5rem] transition-colors ${bgClass} ${
                hasAppt ? 'ring-2 ring-green-400' : ''
              } ${
                isToday ? 'ring-2 ring-blue-400' : ''
              }`}
              title={
                hasAppt 
                  ? `Appointments on ${d.toLocaleDateString()}` 
                  : isToday 
                    ? 'Today' 
                    : d.toLocaleDateString()
              }
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 flex gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-slate-200 bg-white"></span> Available
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-blue-600 bg-blue-100 ring-2 ring-blue-400"></span> Today
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-green-600 bg-green-100 ring-2 ring-green-400"></span> Appointments
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-slate-200 bg-slate-50"></span> Past Days
        </span>
      </div>
    </div>
  );
}