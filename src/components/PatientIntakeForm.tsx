// components/PatientIntakeForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Med = { name: string; dosage: string; timing: string };

export default function PatientIntakeForm() {
  const router = useRouter();

  const [chronicDiseases, setChronicDiseases] = useState('');
  const [medications, setMedications] = useState<Med[]>([
    { name: '', dosage: '', timing: '' }
  ]);
  const [consultingDoctor, setConsultingDoctor] = useState('');
  const [doctorOnPlatform, setDoctorOnPlatform] = useState<'yes' | 'no' | 'maybe'>('maybe');
  const [doctorEmail, setDoctorEmail] = useState('');

  function updateMed(i: number, field: keyof Med, value: string) {
    setMedications((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function addMed() {
    setMedications((prev) => [...prev, { name: '', dosage: '', timing: '' }]);
  }

  function removeMed(i: number) {
    setMedications((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      chronicDiseases,
      medications: medications.filter((m) => m.name && m.dosage && m.timing),
      consultingDoctor,
      doctorOnPlatform,
      doctorEmail: doctorOnPlatform === 'yes' ? '' : doctorEmail
    };

    const res = await fetch('/api/patient/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.message || 'Failed to save profile');
      return;
    }

    router.refresh(); // server page will re-check and render dashboard
  }

  return (
    <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-center text-xl font-semibold text-slate-800">
        Complete your medical profile
      </h2>

      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Chronic diseases
          </label>
          <textarea
            placeholder="e.g. diabetes, hypertension"
            value={chronicDiseases}
            onChange={(e) => setChronicDiseases(e.target.value)}
            className="min-h-[88px] w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          <p className="text-xs text-slate-500">
            Separate multiple items with commas.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="text-sm font-medium text-slate-700">Medications</div>
          {medications.map((m, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <input
                placeholder="Medication name"
                value={m.name}
                onChange={(e) => updateMed(i, 'name', e.target.value)}
                className="md:col-span-5 rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <input
                placeholder="Dosage (e.g. 500mg)"
                value={m.dosage}
                onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                className="md:col-span-3 rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <input
                placeholder="Timing (e.g. 2x/day)"
                value={m.timing}
                onChange={(e) => updateMed(i, 'timing', e.target.value)}
                className="md:col-span-3 rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="button"
                onClick={() => removeMed(i)}
                className="md:col-span-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMed}
            className="w-fit rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Add medication
          </button>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700">Consulting doctor (name)</label>
          <input
            placeholder="Dr. Jane Doe"
            value={consultingDoctor}
            onChange={(e) => setConsultingDoctor(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            Is this doctor on this platform?
          </span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="onPlatform"
                value="yes"
                checked={doctorOnPlatform === 'yes'}
                onChange={() => setDoctorOnPlatform('yes')}
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="onPlatform"
                value="no"
                checked={doctorOnPlatform === 'no'}
                onChange={() => setDoctorOnPlatform('no')}
              />
              No
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="onPlatform"
                value="maybe"
                checked={doctorOnPlatform === 'maybe'}
                onChange={() => setDoctorOnPlatform('maybe')}
              />
              Maybe
            </label>
          </div>
        </div>

        {(doctorOnPlatform === 'no' || doctorOnPlatform === 'maybe') && (
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Doctor email</label>
            <input
              type="email"
              placeholder="doctor@example.com"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <p className="text-xs text-slate-500">
              Used to email the patient report if the doctor isn’t on the platform.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Save profile
        </button>
      </form>
    </div>
  );
}
