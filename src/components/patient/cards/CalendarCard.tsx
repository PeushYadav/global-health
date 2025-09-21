// components/patient/cards/CalendarCard.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { TZ, ymdLocal, headerLocal } from '@/utils/date';

export default function CalendarCard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [appts, setAppts] = useState<string[]>([]);
  const [loginActivity, setLoginActivity] = useState<string[]>([]);
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

    const handleMedicationTaken = () => {
      refreshCalendar();
    };

    window.addEventListener('appointmentBooked', handleAppointmentUpdate);
    window.addEventListener('medicationTaken', handleMedicationTaken);
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentUpdate);
      window.removeEventListener('medicationTaken', handleMedicationTaken);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const l = await fetch('/api/patient/daily-logs?range=60', { cache: 'no-store' });
      if (l.ok) {
        const data = await l.json();
        // API returns server-computed local keys; keep as-is
        setLogs((data || []).filter((x: any) => x.taken).map((x: any) => x.date));
      }
      
      // Fetch patient's appointments instead of doctor's appointments
      const a = await fetch('/api/patient/appointments', { cache: 'no-store' });
      if (a.ok) {
        const arr = await a.json();
        setAppts(arr.filter((x: any) => x.status === 'upcoming').map((x: any) => ymdLocal(new Date(x.when))));
      }

      // Fetch login activity
      const loginRes = await fetch('/api/patient/login-activity', { cache: 'no-store' });
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        setLoginActivity(loginData.map((x: any) => x.date));
      }
    })();
  }, [refreshKey]); // Add refreshKey as dependency

  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1));

  const logSet = useMemo(() => new Set(logs), [logs]);
  const apptSet = useMemo(() => new Set(appts), [appts]);
  const loginSet = useMemo(() => new Set(loginActivity), [loginActivity]);

  const header = headerLocal(today);

  return (
    <div className="rounded-2xl bg-gray-100 p-5 shadow-xl">
      {/* suppressHydrationWarning avoids noisy console if extensions tweak DOM */}
      <div className="mb-3 text-sm text-slate-600" suppressHydrationWarning>
        {mounted ? header : ''}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const key = ymdLocal(d);
          const streak = logSet.has(key);
          const appt = apptSet.has(key);
          const hasLogin = loginSet.has(key);
          
          // Determine the background color based on activity
          let bgClass = 'border-slate-900 bg-slate-900 text-white';
          if (hasLogin && streak) {
            // Both login and medication taken
            bgClass = 'border-emerald-600 bg-emerald-100 text-slate-900';
          } else if (hasLogin) {
            // Only login activity
            bgClass = 'border-green-600 bg-green-50 text-slate-900';
          } else if (streak) {
            // Only medication streak
            bgClass = 'border-blue-600 bg-blue-50 text-slate-900';
          }
          
          return (
            <div
              key={i}
              className={`aspect-square rounded-full border text-center text-sm leading-[2.5rem] ${bgClass} ${
                appt ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-slate-900 bg-slate-900"></span> Default
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-green-600 bg-green-50"></span> Login Activity
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-blue-600 bg-blue-50"></span> Medication
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-emerald-600 bg-emerald-100"></span> Both
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-slate-900 ring-2 ring-yellow-400"></span> Appointments
        </span>
      </div>
    </div>
  );
}
