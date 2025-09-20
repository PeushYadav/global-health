// components/patient/cards/CalendarCard.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
function ymd(d: Date){ return d.toISOString().slice(0,10); }

export default function CalendarCard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [appts, setAppts] = useState<string[]>([]);
  const today = new Date();

  useEffect(() => {
    (async () => {
      const l = await fetch('/api/patient/daily-log?range=42', { cache: 'no-store' });
      if (l.ok) {
        const data = await l.json();
        setLogs((data||[]).filter((x:any)=>x.taken).map((x:any)=>x.date));
      }
      const a = await fetch('/api/doctors/appointments?upcoming=true', { cache: 'no-store' });
      if (a.ok) {
        const arr = await a.json();
        setAppts(arr.map((x:any) => ymd(new Date(x.when))));
      }
    })();
  }, []);

  const year=today.getFullYear(), month=today.getMonth();
  const first=new Date(year,month,1), last=new Date(year,month+1,0);
  const days = Array.from({length:last.getDate()},(_,i)=>new Date(year,month,i+1));
  const logSet = useMemo(()=>new Set(logs),[logs]);
  const apptSet = useMemo(()=>new Set(appts),[appts]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm text-slate-600">{today.toLocaleDateString(undefined,{ weekday:'long', day:'numeric', month:'long' })}</div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d,i)=>{
          const key=ymd(d);
          const streak=logSet.has(key);
          const appt=apptSet.has(key);
          return (
            <div key={i} className={`aspect-square rounded-md border text-center text-sm leading-[2.5rem] ${streak ? 'border-green-600 bg-green-50' : 'border-slate-200'} ${appt ? 'ring-2 ring-slate-900' : ''}`}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded border border-green-600 bg-green-50"></span> Your Streak</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded border border-slate-900 ring-2 ring-slate-900"></span> Appointments</span>
      </div>
    </div>
  );
}
