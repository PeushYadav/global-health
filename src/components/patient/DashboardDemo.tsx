// components/patient/DashboardDemo.tsx
'use client';

import { useMemo, useState } from 'react';

type Appointment = { when: string; doctorName: string; reason: string; location?: string; status?: 'upcoming'|'completed'|'cancelled' };
type Med = { name: string; dosage: string; timing: string; taken?: boolean };
type Msg = { body: string; sentAt: string };

export default function DashboardDemo() {
  // Top banner
  const firstName = 'Peush';

  // Calendar + streak (mark a few recent days as taken)
  const today = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const streakDays = new Set<string>([
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 9)),
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8)),
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)),
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)),
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5)),
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4)),
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3)),
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
    ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
    ymd(today)
  ]);
  const currentStreak = streakDays.size;

  // Appointments
  const appointments: Appointment[] = [
    { when: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0).toISOString(), doctorName: 'Dr. Suresh Kumar', reason: 'Follow-up consultation', location: 'City Clinic', status: 'upcoming' },
    { when: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 14, 30).toISOString(), doctorName: 'Dr. Suresh Kumar', reason: 'Lab report review', location: 'City Clinic', status: 'upcoming' },
    { when: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 11, 0).toISOString(), doctorName: 'Dr. Suresh Kumar', reason: 'General checkup', location: 'City Clinic', status: 'completed' }
  ];

  // Metrics tiles
  const metrics = {
    hr: { value: 91, unit: 'bpm' },
    bp: { value: 160, unit: 'mmHg' },
    hydration: { value: 1100, unit: 'ml' }
  };

  // Health overview chart (simple inline data)
  const series = useMemo(
    () => [
      { t: -6, v: 62 },
      { t: -5, v: 70 },
      { t: -4, v: 55 },
      { t: -3, v: 68 },
      { t: -2, v: 64 },
      { t: -1, v: 72 },
      { t: 0, v: 66 }
    ], []
  );

  // Chat preview
  const [messages, setMessages] = useState<Msg[]>([
    { body: 'Hi, what does Metformin do?', sentAt: new Date().toISOString() },
    { body: 'It helps control blood sugar levels.', sentAt: new Date().toISOString() }
  ]);
  const [text, setText] = useState('');

  // Today’s medication
  const [meds, setMeds] = useState<Med[]>([
    { name: 'Metformin', dosage: '500mg', timing: '8:00 AM', taken: true },
    { name: 'Metformin', dosage: '500mg', timing: '8:00 PM', taken: false },
    { name: 'Amlodipine', dosage: '5mg', timing: '9:00 AM', taken: false }
  ]);

  function markTaken(name: string, timing: string) {
    setMeds(prev => prev.map(m => (m.name === name && m.timing === timing ? { ...m, taken: true } : m)));
  }

  function sendMessage() {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { body: text.trim(), sentAt: new Date().toISOString() }]);
    setText('');
  }

  // Calendar grid for current month
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1));
  const apptDates = new Set(appointments.filter(a => new Date(a.when) >= new Date()).map(a => ymd(new Date(a.when))));

  // Simple chart path
  const w = 440, h = 180, p = 20;
  const xs = series.map((d) => d.t);
  const ys = series.map((d) => d.v);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const sx = (x: number) => p + ((x - minX) / (maxX - minX || 1)) * (w - 2 * p);
  const sy = (y: number) => h - p - ((y - minY) / (maxY - minY || 1)) * (h - 2 * p);
  const path = series.map((d, i) => `${i ? 'L' : 'M'} ${sx(d.t)} ${sy(d.v)}`).join(' ');

  return (
    <main className="min-h-screen bg-[#faf8f6]">
      <section className="mx-auto max-w-7xl px-4 py-6">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-[#fdebdc] px-6 py-8 shadow-sm">
          <div className="text-3xl font-semibold text-slate-900">
            Welcome Back, {firstName}
          </div>
          <div className="mt-4 flex gap-3">
            <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">Scan Prescription</button>
            <button className="rounded-md bg-orange-200 px-3 py-1.5 text-sm font-medium text-slate-900">Emergency Contact</button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          {/* Left column */}
          <div className="md:col-span-8 grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Calendar card */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 text-sm text-slate-600">
                  {today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((d, i) => {
                    const key = ymd(d);
                    const streak = streakDays.has(key);
                    const appt = apptDates.has(key);
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-full border text-center text-sm leading-[2.5rem] ${streak ? 'border-green-600 bg-green-50 text-slate-900' : 'border-slate-900 bg-slate-900 text-white'} ${appt ? 'ring-2 ring-yellow-400' : ''}`}
                      >
                        {d.getDate()}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full border border-slate-900 bg-slate-900"></span> Default
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full border border-green-600 bg-green-50"></span> Your Streak
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full border border-slate-900 ring-2 ring-yellow-400"></span> Appointments
                  </span>
                </div>
              </div>

              {/* Appointments card */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 text-lg font-semibold text-slate-900">Doctors Appointments</div>
                <ul className="grid gap-3">
                  {appointments.slice(0, 3).map((a, i) => (
                    <li key={i} className="rounded-xl border border-slate-200 p-3">
                      <div className="text-sm font-medium text-slate-900">{a.doctorName}</div>
                      <div className="text-xs text-slate-600">
                        {new Date(a.when).toLocaleString()} • {a.location || 'Clinic'}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{a.reason}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Health overview mini chart */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 text-xl font-semibold text-slate-900">Daily Health Overview</div>
              <svg width={440} height={180} className="w-full">
                <rect x="0" y="0" width={440} height={180} fill="white" />
                <path d={path} stroke="#0f172a" strokeWidth="2" fill="none" />
              </svg>
              <p className="mt-2 text-xs text-slate-500">Recent trend (dummy data)</p>
            </div>

            {/* Chat area with streak banner */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 text-center text-sm font-medium text-slate-700 bg-orange-100 rounded-md py-1">
                Doing great with {currentStreak} day streak!
              </div>
              <div className="h-48 overflow-auto rounded-md border border-slate-200 p-2">
                {messages.map((m, i) => (
                  <div key={i} className="mb-2 rounded border border-slate-200 p-2 text-sm">
                    <div>{m.body}</div>
                    <div className="text-xs text-slate-500">{new Date(m.sentAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Type a message"
                />
                <button onClick={sendMessage} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-4 grid gap-6">
            {/* Metric tiles */}
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-600">Heart Rate</div>
              <div className="text-5xl font-semibold text-slate-900">{metrics.hr.value}</div>
              <div className="text-xs text-slate-500">{metrics.hr.unit}</div>
            </div>
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-600">Blood Pressure</div>
              <div className="text-5xl font-semibold text-slate-900">{metrics.bp.value}</div>
              <div className="text-xs text-slate-500">{metrics.bp.unit}</div>
            </div>
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-600">Hydration Level</div>
              <div className="text-5xl font-semibold text-slate-900">{metrics.hydration.value}</div>
              <div className="text-xs text-slate-500">{metrics.hydration.unit}</div>
            </div>

            {/* Today’s medication */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 text-lg font-semibold text-slate-900">Today’s medication</div>
              <ul className="grid gap-2">
                {meds.map((m, i) => (
                  <li
                    key={`${m.name}-${m.timing}-${i}`}
                    className={`flex items-center justify-between rounded-xl border p-3 ${m.taken ? 'border-green-600 bg-green-50' : 'border-slate-200'}`}
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-600">
                        {m.dosage} • {m.timing}
                      </div>
                    </div>
                    {!m.taken && (
                      <button
                        onClick={() => markTaken(m.name, m.timing)}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Take Now
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
