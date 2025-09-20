// components/patient/cards/WelcomeHero.tsx
'use client';
import { useState } from 'react';
import ManualEntryForm from '@/components/patient/ManualEntryForm';

export default function WelcomeHero({ firstName }: { firstName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl bg-[#fdebdc] px-6 py-8 shadow-sm ">
        <div className="text-3xl font-semibold text-slate-900 flex justify-center items-center">
          Welcome Back<span className="text-slate-900">&nbsp;,&nbsp;</span> {firstName || 'Patient'}
        </div>
        <div className="mt-4 flex gap-3 justify-center items-center">
          <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-gray-500">
            Scan Picture
          </button>
          <button
            onClick={() => setOpen(true)}
            className="rounded-md bg-orange-200 px-3 py-1.5 text-sm font-medium text-slate-900"
          >
            Enter Manually
          </button>
        </div>
      </div>

      <ManualEntryForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
