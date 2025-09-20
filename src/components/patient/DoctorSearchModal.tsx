// components/patient/DoctorSearchModal.tsx
'use client';
import { useEffect, useState } from 'react';

export default function DoctorSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q,setQ]=useState(''); const [specialty,setSpecialty]=useState(''); const [city,setCity]=useState('');
  const [minExp,setMinExp]=useState(0); const [languages,setLanguages]=useState(''); const [accepting,setAccepting]=useState(true);
  const [results,setResults]=useState<any[]>([]);
  const [context,setContext]=useState({ reason:'', conditions:'', currentMeds:'', preferredTime:'', notes:'' });
  const [selected,setSelected]=useState<any>(null);

  async function search() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (specialty) params.set('specialty', specialty);
    if (city) params.set('city', city);
    if (minExp) params.set('minExp', String(minExp));
    if (languages) params.set('languages', languages);
    if (accepting) params.set('accepting', 'true');
    const r = await fetch(`/api/doctors/search?${params.toString()}`, { cache:'no-store' });
    if (r.ok) setResults(await r.json());
  }

  useEffect(()=>{ if (open) search(); }, [open]);

  async function sendRequest() {
    if (!selected) return;
    const payload = {
      doctorId: selected.id,
      reason: context.reason,
      conditions: context.conditions.split(',').map(s=>s.trim()).filter(Boolean),
      currentMeds: context.currentMeds.split(',').map(s=>s.trim()).filter(Boolean),
      preferredTime: context.preferredTime,
      notes: context.notes
    };
    const r = await fetch('/api/requests', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (r.ok) { alert('Request sent'); onClose(); } else { const d=await r.json().catch(()=>({})); alert(d?.message||'Failed'); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-900">Find a doctor</div>
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm">Close</button>
        </div>
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-5 grid gap-2">
            <input placeholder="Search (text)" className="rounded-md border px-3 py-2" value={q} onChange={e=>setQ(e.target.value)} />
            <input placeholder="Specialty" className="rounded-md border px-3 py-2" value={specialty} onChange={e=>setSpecialty(e.target.value)} />
            <input placeholder="City" className="rounded-md border px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} />
            <input placeholder="Min experience" type="number" className="rounded-md border px-3 py-2" value={minExp} onChange={e=>setMinExp(Number(e.target.value))} />
            <input placeholder="Languages (comma)" className="rounded-md border px-3 py-2" value={languages} onChange={e=>setLanguages(e.target.value)} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accepting} onChange={e=>setAccepting(e.target.checked)} /> Accepting new patients</label>
            <button onClick={search} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">Search</button>
            <ul className="mt-2 grid gap-2 max-h-64 overflow-auto">
              {results.map((d:any)=>(
                <li key={d.id}>
                  <button onClick={()=>setSelected(d)} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selected?.id===d.id?'border-slate-900 bg-slate-900 text-white':'border-slate-300'}`}>
                    <div className="font-medium">{d.name} — {d.specialty}</div>
                    <div className="text-xs text-slate-600">{d.city} • {d.yearsExperience} yrs • {d.languages?.join(', ')}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-7 grid gap-2">
            <div className="text-sm font-medium text-slate-900">Information for the doctor</div>
            <input placeholder="Reason for visit" className="rounded-md border px-3 py-2" value={context.reason} onChange={e=>setContext({...context, reason:e.target.value})}/>
            <input placeholder="Conditions (comma)" className="rounded-md border px-3 py-2" value={context.conditions} onChange={e=>setContext({...context, conditions:e.target.value})}/>
            <input placeholder="Current medications (comma)" className="rounded-md border px-3 py-2" value={context.currentMeds} onChange={e=>setContext({...context, currentMeds:e.target.value})}/>
            <input placeholder="Preferred time" className="rounded-md border px-3 py-2" value={context.preferredTime} onChange={e=>setContext({...context, preferredTime:e.target.value})}/>
            <textarea placeholder="Notes for the doctor" className="min-h-[100px] rounded-md border px-3 py-2" value={context.notes} onChange={e=>setContext({...context, notes:e.target.value})}/>
            <button disabled={!selected} onClick={sendRequest} className="mt-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Send request</button>
          </div>
        </div>
      </div>
    </div>
  );
}
