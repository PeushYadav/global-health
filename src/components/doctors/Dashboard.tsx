// components/doctor/Dashboard.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import PatientsList from './PatientsList';
import ChatPanel from './ChatPanel';
import AppointmentsPanel from './AppointmentsPanel';

export default function Dashboard({
  doctorId, doctorEmail, firstName
}: { doctorId: string; doctorEmail: string; firstName: string }) {
  const [patients, setPatients] = useState<{ id: string; name: string; email: string }[]>([]);
  const [activePatient, setActivePatient] = useState<string>('');

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/doctor/patients', { cache: 'no-store' });
      if (r.ok) {
        const list = await r.json();
        setPatients(list);
        if (!activePatient && list.length) setActivePatient(list[0].id);
      }
    })();
  }, []);

  const active = useMemo(() => patients.find(p => p.id === activePatient), [patients, activePatient]);

  return (
    <main className="min-h-screen bg-[#faf8f6]">
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-2xl bg-[#e8f0ff] px-6 py-5 shadow-sm">
          <div className="text-2xl font-semibold text-slate-900">Welcome, {firstName || 'Doctor'}</div>
          <div className="text-sm text-slate-600">Manage patients, chats, and appointments</div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <PatientsList
              patients={patients}
              activeId={activePatient}
              onSelect={setActivePatient}
            />
          </div>
          <div className="md:col-span-8 grid gap-6">
            <ChatPanel doctorId={doctorId} patientId={activePatient} patientLabel={active?.name || active?.email || ''} />
            <AppointmentsPanel />
          </div>
        </div>
      </section>
    </main>
  );
}
