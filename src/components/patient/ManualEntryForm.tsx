// components/patient/ManualEntryForm.tsx
'use client';

import { useState } from 'react';

type Med = { name: string; dosage: string; timing: string };

export default function ManualEntryForm({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [diseases, setDiseases] = useState('');
  const [meds, setMeds] = useState<Med[]>([{ name: '', dosage: '', timing: '' }]);

  // Vitals (tiles + chart)
  const [hr, setHr] = useState<number | ''>('');
  const [bp, setBp] = useState<number | ''>(''); // keep simple; split later if needed
  const [hydration, setHydration] = useState<number | ''>('');
  const [takenAt, setTakenAt] = useState<string>(new Date().toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm

  // Daily log
  const [markTodayTaken, setMarkTodayTaken] = useState(false);

  // Optional appointment
  const [appt, setAppt] = useState({
    doctorName: '',
    when: new Date().toISOString().slice(0, 16),
    reason: '',
    location: ''
  });

  const [busy, setBusy] = useState(false);

  function setMed(i: number, field: keyof Med, value: string) {
    setMeds(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }
  function addMed() {
    setMeds(prev => [...prev, { name: '', dosage: '', timing: '' }]);
  }
  function removeMed(i: number) {
    setMeds(prev => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const payload = {
      profile: {
        chronicDiseases: diseases.split(',').map(s => s.trim()).filter(Boolean),
        medications: meds.filter(m => m.name && m.dosage && m.timing)
      },
      vitals: {
        hr: hr === '' ? null : Number(hr),
        bp: bp === '' ? null : Number(bp),
        hydration: hydration === '' ? null : Number(hydration),
        takenAt: new Date(takenAt).toISOString()
      },
      dailyLog: { markTodayTaken },
      appointment: appt.doctorName && appt.when ? { ...appt, when: new Date(appt.when).toISOString() } : null
    };

    try {
      const res = await fetch('/api/patient/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }); // Route Handler in app/api/patient/manual [web:230]

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message || 'Failed to save');
        setBusy(false);
        return;
      }

      // Optionally refresh the page to re-fetch tiles/cards from GET endpoints
      // if used inside a page, you can call router.refresh() here

      onClose();
    } catch (err) {
      alert('Network error');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Enter data manually</h2>
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm">Close</button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-6">
          {/* Medical profile */}
          <section className="grid gap-3">
            <div className="text-sm font-medium text-slate-800">Medical profile</div>
            <div>
              <label className="text-sm text-slate-700">Chronic diseases</label>
              <textarea
                className="mt-1 w-full rounded-md border text-gray-700 border-slate-300 px-3 py-2"
                placeholder="e.g. diabetes, hypertension"
                value={diseases}
                onChange={(e) => setDiseases(e.target.value)}
              />
              <p className="text-xs text-slate-500">Separate with commas.</p>
            </div>

            <div className="grid gap-2">
              <div className="text-sm text-slate-700">Medications</div>
              {meds.map((m, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-12">
                  <input
                    placeholder="Name"
                    value={m.name}
                    onChange={(e) => setMed(i, 'name', e.target.value)}
                    className="md:col-span-5 rounded-md border text-gray-700 border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Dosage (e.g. 500mg)"
                    value={m.dosage}
                    onChange={(e) => setMed(i, 'dosage', e.target.value)}
                    className="md:col-span-3 rounded-md border text-gray-700 border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Timing (e.g. 8:00 AM)"
                    value={m.timing}
                    onChange={(e) => setMed(i, 'timing', e.target.value)}
                    className="md:col-span-3 rounded-md border text-gray-700 border-slate-300 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeMed(i)}
                    className="md:col-span-1 rounded-md border text-gray-700 border-slate-300 px-3 py-2 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={addMed} className="w-fit rounded-md border text-gray-700 border-slate-300 px-3 py-1.5 text-sm">
                Add medication
              </button>
            </div>
          </section>

          {/* Vitals */}
          <section className="grid gap-3">
            <div className="text-sm font-medium text-slate-800">Vitals</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <input
                placeholder="Heart Rate (bpm)"
                type="number"
                value={hr}
                onChange={(e) => setHr(e.target.value === '' ? '' : Number(e.target.value))}
                className="md:col-span-4 rounded-md border text-gray-700 border-slate-300 px-3 py-2"
              />
              <input
                placeholder="Blood Pressure (mmHg)"
                type="number"
                value={bp}
                onChange={(e) => setBp(e.target.value === '' ? '' : Number(e.target.value))}
                className="md:col-span-4 rounded-md border text-gray-700 border-slate-300 px-3 py-2"
              />
              <input
                placeholder="Hydration (ml)"
                type="number"
                value={hydration}
                onChange={(e) => setHydration(e.target.value === '' ? '' : Number(e.target.value))}
                className="md:col-span-4 rounded-md border text-gray-700 border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700">Timestamp</label>
              <input
                type="datetime-local"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="mt-1 w-full rounded-md border text-gray-700 border-slate-300 px-3 py-2"
              />
            </div>
          </section>

          {/* Daily log */}
          <section className="grid gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={markTodayTaken}
                onChange={(e) => setMarkTodayTaken(e.target.checked)}
              />
              Mark today as taken (updates streak)
            </label>
          </section>

          {/* Optional appointment */}
          <section className="grid gap-3">
            <div className="text-sm font-medium text-slate-800">Optional appointment</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <input
                placeholder="Doctor name"
                value={appt.doctorName}
                onChange={(e) => setAppt({ ...appt, doctorName: e.target.value })}
                className="md:col-span-6 text-gray-700 rounded-md border border-slate-300 px-3 py-2"
              />
              <input
                type="datetime-local"
                value={appt.when}
                onChange={(e) => setAppt({ ...appt, when: e.target.value })}
                className="md:col-span-6 text-gray-700 rounded-md border border-slate-300 px-3 py-2"
              />
              <input
                placeholder="Reason"
                value={appt.reason}
                onChange={(e) => setAppt({ ...appt, reason: e.target.value })}
                className="md:col-span-8 text-gray-700 rounded-md border border-slate-300 px-3 py-2"
              />
              <input
                placeholder="Location"
                value={appt.location}
                onChange={(e) => setAppt({ ...appt, location: e.target.value })}
                className="md:col-span-4 text-gray-700 rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm" disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
