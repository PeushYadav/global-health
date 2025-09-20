// components/patient/cards/TodayMedsCard.tsx
'use client';
import { useEffect, useState } from 'react';

export default function TodayMedsCard() {
  const [rows,setRows]=useState<any[]>([]);
  useEffect(()=>{(async()=>{ const r=await fetch('/api/patient/medications/today',{cache:'no-store'}); if(r.ok){ const data=await r.json(); setRows(data.meds||[]);} })();},[]);

  async function take(name:string){
    const r=await fetch('/api/patient/medications/take',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
    if(r.ok) setRows(prev=>prev.map(m=>m.name===name?{...m,taken:true}:m));
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-lg font-semibold text-slate-900">Today’s medication</div>
      <ul className="grid gap-2">
        {rows.map((m:any,i:number)=>(
          <li key={i} className={`flex items-center justify-between rounded-xl border p-3 ${m.taken?'border-green-600 bg-green-50':'border-slate-200'}`}>
            <div>
              <div className="text-sm font-medium text-slate-900">{m.name}</div>
              <div className="text-xs text-slate-600">{m.dosage} • {m.timing}</div>
            </div>
            {!m.taken && (
              <button onClick={()=>take(m.name)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Take Now</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
