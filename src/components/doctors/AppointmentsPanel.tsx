// components/doctor/AppointmentsPanel.tsx
'use client';
import { useEffect, useState } from 'react';

export default function AppointmentsPanel() {
  const [pending, setPending] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  async function load() {
    const p = await fetch('/api/doctor/appointments?status=pending', { cache: 'no-store' });
    const u = await fetch('/api/doctor/appointments?status=upcoming', { cache: 'no-store' });
    if (p.ok) setPending(await p.json());
    if (u.ok) setUpcoming(await u.json());
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
      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <section>
          <div className="mb-2 text-lg font-semibold text-slate-900">Pending requests</div>
          <ul className="grid gap-2">
            {pending.map((a:any)=>(
              <li key={a.id} className="rounded border border-slate-200 p-3 text-sm">
                <div className="font-medium">{new Date(a.when).toLocaleString()}</div>
                <div className="text-slate-600">{a.reason || 'Consultation'} • {a.location || 'Clinic'}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={()=>act(a.id,'accept')} className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">Accept</button>
                  <button onClick={()=>act(a.id,'decline')} className="rounded-md bg-rose-600 px-3 py-1.5 text-white">Decline</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <div className="mb-2 text-lg font-semibold text-slate-900">Upcoming</div>
          <ul className="grid gap-2">
            {upcoming.map((a:any)=>(
              <li key={a.id} className="rounded border border-slate-200 p-3 text-sm">
                <div className="font-medium">{new Date(a.when).toLocaleString()}</div>
                <div className="text-slate-600">{a.reason || 'Consultation'} • {a.location || 'Clinic'}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
