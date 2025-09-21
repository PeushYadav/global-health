// components/doctor/Dashboard.tsx
'use client';
import { useEffect, useState } from 'react';
import PatientsList from './PatientsList';
import AppointmentsPanel from './AppointmentsPanel';
import AIChatPanel from './AIChatPanel';
import DoctorCalendarCard from './DoctorCalendarCard';
import PatientMonitoringPanel from './PatientMonitoringPanel';
import PatientStreakGraphCard from './PatientStreakGraphCard';
import MedicationManagementCard from './MedicationManagementCard';

export default function Dashboard({
  doctorId, doctorEmail, firstName
}: { doctorId: string; doctorEmail: string; firstName: string }) {
  const [patients, setPatients] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/doctor/patients', { cache: 'no-store' });
      if (r.ok) {
        const list = await r.json();
        setPatients(list);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-[#faf8f6]">
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-2xl bg-[#e8f0ff] px-6 py-5 shadow-sm">
          <div className="text-2xl font-semibold text-slate-900">Welcome, {firstName || 'Doctor'}</div>
          <div className="text-sm text-slate-600">AI Medical Assistant & Patient Management Dashboard</div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Left Column - Calendar and Patient Monitoring */}
          <div className="lg:col-span-4 grid gap-6">
            <DoctorCalendarCard />
            <PatientMonitoringPanel />
          </div>

          {/* Center Column - AI Chat and Graph */}
          <div className="lg:col-span-5 grid gap-6">
            {/* AI Medical Assistant */}
            <div className="h-[400px]">
              <AIChatPanel />
            </div>
            
            {/* Patient Health Graph */}
            <PatientStreakGraphCard />
          </div>

          {/* Right Column - Appointments and Medication Management */}
          <div className="lg:col-span-3 grid gap-6">
            <AppointmentsPanel />
            <MedicationManagementCard />
          </div>
        </div>
      </section>
    </main>
  );
}
