// components/doctor/OnboardingForm.tsx
'use client';
import { useState } from 'react';

export default function OnboardingForm() {
  const [form, setForm] = useState({
    specialty: '', subSpecialties: '', yearsExperience: 0, resumeUrl: '', bio: '',
    languages: '', city: '', acceptingNewPatients: true, consultationFee: ''
  });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      subSpecialties: form.subSpecialties.split(',').map(s=>s.trim()).filter(Boolean),
      languages: form.languages.split(',').map(s=>s.trim()).filter(Boolean),
      yearsExperience: Number(form.yearsExperience || 0),
      consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined
    };
    const r = await fetch('/api/doctor/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) location.reload();
    else alert('Failed to save');
  }
  return (
    <form onSubmit={save} className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">Complete your doctor profile</h2>
      <div className="grid gap-3">
        <input placeholder="Specialty (e.g. Cardiology)" className="rounded-md border px-3 py-2" value={form.specialty} onChange={e=>setForm({...form, specialty:e.target.value})}/>
        <input placeholder="Sub‑specialties (comma‑separated)" className="rounded-md border px-3 py-2" value={form.subSpecialties} onChange={e=>setForm({...form, subSpecialties:e.target.value})}/>
        <input placeholder="Years of experience" type="number" className="rounded-md border px-3 py-2" value={form.yearsExperience} onChange={e=>setForm({...form, yearsExperience:Number(e.target.value)})}/>
        <input placeholder="Resume URL" className="rounded-md border px-3 py-2" value={form.resumeUrl} onChange={e=>setForm({...form, resumeUrl:e.target.value})}/>
        <textarea placeholder="Bio" className="rounded-md border px-3 py-2 min-h-[100px]" value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})}/>
        <input placeholder="Languages (comma‑separated)" className="rounded-md border px-3 py-2" value={form.languages} onChange={e=>setForm({...form, languages:e.target.value})}/>
        <input placeholder="City" className="rounded-md border px-3 py-2" value={form.city} onChange={e=>setForm({...form, city:e.target.value})}/>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.acceptingNewPatients} onChange={e=>setForm({...form, acceptingNewPatients:e.target.checked})}/> Accepting new patients
        </label>
        <input placeholder="Consultation fee (optional)" type="number" className="rounded-md border px-3 py-2" value={form.consultationFee} onChange={e=>setForm({...form, consultationFee:e.target.value})}/>
        <button className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save</button>
      </div>
    </form>
  );
}
