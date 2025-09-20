// components/doctor/AppointmentsPanel.tsx
'use client';
import { useEffect, useState } from 'react';

export default function AppointmentsPanel() {
  const [pending, setPending] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  async function load() {
    const all = await fetch('/api/doctor/appointments', { cache: 'no-store' });
    if (all.ok) {
      const appointments = await all.json();
      // Filter pending and upcoming appointments
      setPending(appointments.filter((a: any) => a.status === 'upcoming' && new Date(a.when) > new Date()));
      setUpcoming(appointments.filter((a: any) => a.status === 'upcoming' && new Date(a.when) > new Date()).slice(0, 5));
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: 'accept'|'decline') {
    const r = await fetch('/api/doctor/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    if (r.ok) await load();
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4">
        <section>
          <div className="mb-3 text-lg font-semibold text-slate-900">Patient Appointments</div>
          {upcoming.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No upcoming appointments</p>
              <p className="text-xs mt-1">Patients can book appointments through their dashboard</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {upcoming.map((a:any)=>(
                <li key={a.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {a.patient?.name || a.patient?.email || 'Unknown Patient'}
                      </div>
                      <div className="text-xs text-slate-600">
                        {new Date(a.when).toLocaleDateString()} at {new Date(a.when).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="text-xs text-slate-600">{a.reason || 'Consultation'}</div>
                      {a.location && <div className="text-xs text-slate-600">{a.location}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-center">
                        {a.status}
                      </div>
                      {a.status === 'upcoming' && (
                        <button 
                          onClick={()=>act(a.id,'decline')} 
                          className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full hover:bg-red-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
