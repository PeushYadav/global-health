// components/patient/cards/WelcomeHero.tsx
'use client';
export default function WelcomeHero({ firstName }: { firstName: string }) {
  return (
    <div className="rounded-2xl bg-[#fdebdc] px-6 py-8 shadow-sm">
      <div className="text-3xl font-semibold text-slate-900">
        Welcome Back<span className="text-slate-900">,</span> {firstName || 'Patient'}
      </div>
      <div className="mt-4 flex gap-3">
        <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">Scan Prescription</button>
        <button className="rounded-md bg-orange-200 px-3 py-1.5 text-sm font-medium text-slate-900">Emergency Contact</button>
      </div>
    </div>
  );
}
