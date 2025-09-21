// components/patient/Dashboard.tsx
'use client';
import { useEffect, useState } from 'react';
import WelcomeHero from './cards/WelcomeHero';
import CalendarCard from './cards/CalendarCard';
import AppointmentsCard from './cards/AppointmentsCard';
import HealthOverviewCard from './cards/HealthOverviewCard';
import AIChatCard from './cards/AIChatCard';
import TodayMedsCard from './cards/TodayMedsCard';
import MedicationStreakCard from './cards/MedicationStreakCard';
import LeaderboardCard from './cards/LeaderboardCard';

export default function Dashboard({
  userId, userEmail, firstName, hasProfile
}: { userId: string; userEmail: string; firstName: string; hasProfile: boolean }) {

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
            <AIChatCard />
          </div>

          <div className="md:col-span-4 grid gap-6">
            <MedicationStreakCard />
            <TodayMedsCard />
            <LeaderboardCard />
          </div>
        </div>
      </section>
    </main>
  );
}
