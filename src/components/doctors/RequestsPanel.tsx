// components/doctor/RequestsPanel.tsx
'use client';
import { useEffect, useState } from 'react';

export default function RequestsPanel() {
  const [rows,setRows]=useState<any[]>([]);

  async function load(){ const r=await fetch('/api/doctor/requests',{cache:'no-store'}); if(r.ok) setRows(await r.json()); }
  useEffect(()=>{ load(); }, []);

  async function act(id:string, action:'accept'|'decline'){
    const r=await fetch('/api/doctor/requests',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action})});
    if(r.ok) load();
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-2 text-lg font-semibold text-slate-900">Patient requests</div>
      <ul className="grid gap-2">
        {rows.map((r:any)=>(
          <li key={r.id} className="rounded border border-slate-200 p-3 text-sm">
            <div className="font-medium">{r.patient?.name || r.patient?.email}</div>
            <div className="text-slate-700">{r.reason || 'No reason provided'}</div>
            <div className="text-xs text-slate-600">Conditions: {r.conditions?.join(', ') || '—'}</div>
            <div className="text-xs text-slate-600">Meds: {r.currentMeds?.join(', ') || '—'}</div>
            <div className="text-xs text-slate-600">Preferred time: {r.preferredTime || '—'}</div>
            <div className="mt-2 flex gap-2">
              <button onClick={()=>act(r.id,'accept')} className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">Accept</button>
              <button onClick={()=>act(r.id,'decline')} className="rounded-md bg-rose-600 px-3 py-1.5 text-white">Decline</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
