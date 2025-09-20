// components/patient/cards/AppointmentsCard.tsx
'use client';
import { useEffect, useState } from 'react';

export default function AppointmentsCard() {
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{(async()=>{
    const r=await fetch('/api/doctors/appointments', { cache: 'no-store' });
    if(r.ok) setItems(await r.json());
  })();},[]);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-lg font-semibold text-slate-900">Doctors Appointments</div>
      <ul className="grid gap-3">
        {items.slice(0,3).map((a,i)=>(
          <li key={i} className="rounded-xl border border-slate-200 p-3">
            <div className="text-sm font-medium text-slate-900">{a.doctorName || 'Doctor'}</div>
            <div className="text-xs text-slate-600">{new Date(a.when).toLocaleString()} • {a.location || 'Clinic'}</div>
            {a.reason && <div className="text-xs text-slate-600 mt-0.5">{a.reason}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
