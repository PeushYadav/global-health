// components/patient/cards/MetricCard.tsx
'use client';
export default function MetricCard({ title, value, unit }:{ title:string; value:any; unit:string }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
      <div className="mb-2 text-sm font-medium text-slate-600">{title}</div>
      <div className="text-5xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{unit}</div>
    </div>
  );
}
