// components/patient/Dashboard.tsx
'use client';
import { useEffect, useState } from 'react';
import WelcomeHero from './cards/WelcomeHero';
import CalendarCard from './cards/CalendarCard';
import AppointmentsCard from './cards/AppointmentsCard';
import MetricCard from './cards/MetricCard';
import HealthOverviewCard from './cards/HealthOverviewCard';
import ChatCard from './cards/ChatCard';
import TodayMedsCard from './cards/TodayMedsCard';

export default function Dashboard({
  userId, userEmail, firstName, hasProfile
}: { userId: string; userEmail: string; firstName: string; hasProfile: boolean }) {

  const [metrics, setMetrics] = useState<{ hr:any; bp:any; hydration:any }>({ hr:null, bp:null, hydration:null });

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/patient/metrics/latest', { cache: 'no-store' });
      if (r.ok) setMetrics(await r.json());
    })();
  }, []);

  return (
    <main className="min-h-screen bg-[#faf8f6]">
      <section className="mx-auto max-w-7xl px-4 py-6">
        <WelcomeHero firstName={firstName} />
        <div className="mt-6 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8 grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CalendarCard />
              <AppointmentsCard />
            </div>
            <HealthOverviewCard />
            <ChatCard />
          </div>

          <div className="md:col-span-4 grid gap-6">
            <MetricCard title="Heart Rate" value={metrics.hr?.value ?? '—'} unit={metrics.hr?.unit ?? 'bpm'} />
            <MetricCard title="Blood Pressure" value={metrics.bp?.value ?? '—'} unit={metrics.bp?.unit ?? 'mmHg'} />
            <MetricCard title="Hydration Level" value={metrics.hydration?.value ?? '—'} unit={metrics.hydration?.unit ?? 'ml'} />
            <TodayMedsCard />
          </div>
        </div>
      </section>
    </main>
  );
}
