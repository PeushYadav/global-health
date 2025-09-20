// components/patient/cards/HealthOverviewCard.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
type Pt = { t:number; v:number };
function toSeries(rows:any[], type:string, take=30):Pt[] {
  return rows.filter(r=>r.type===type).sort((a,b)=>new Date(a.takenAt).getTime()-new Date(b.takenAt).getTime()).slice(-take).map(r=>({ t:new Date(r.takenAt).getTime(), v:Number(r.value) }));
}

export default function HealthOverviewCard() {
  const [rows,setRows]=useState<any[]>([]);
  const [type,setType]=useState('hr');
  useEffect(()=>{(async()=>{
    const r=await fetch('/api/patient/device-data?limit=200', { cache: 'no-store' });
    if(r.ok) setRows(await r.json());
  })();},[]);
  const data=useMemo(()=>toSeries(rows,type),[rows,type]);
  const w=440,h=180,p=20; const xs=data.map(d=>d.t), ys=data.map(d=>d.v);
  const minX=Math.min(...xs,Date.now()-1), maxX=Math.max(...xs,Date.now());
  const minY=Math.min(...ys,0), maxY=Math.max(...ys,1);
  const sx=(x:number)=>p+((x-minX)/(maxX-minX||1))*(w-2*p);
  const sy=(y:number)=>h-p-((y-minY)/(maxY-minY||1))*(h-2*p);
  const path=data.map((d,i)=>`${i?'L':'M'} ${sx(d.t)} ${sy(d.v)}`).join(' ');
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-xl font-semibold text-slate-900">Daily Health Overview</div>
      <div className="mb-2">
        <select value={type} onChange={e=>setType(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
          <option value="hr">Heart Rate</option>
          <option value="bp">Blood Pressure</option>
          <option value="hydration">Hydration</option>
        </select>
      </div>
      <svg width={w} height={h} className="w-full"><rect x="0" y="0" width={w} height={h} fill="white"/><path d={path} stroke="#0f172a" strokeWidth="2" fill="none"/></svg>
    </div>
  );
}
