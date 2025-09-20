// components/doctor/PatientsList.tsx
'use client';

export default function PatientsList({
  patients, activeId, onSelect
}: {
  patients: { id: string; name: string; email: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-lg font-semibold text-slate-900">Patients</div>
      <ul className="grid gap-2">
        {patients.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p.id)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                activeId === p.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'
              }`}
            >
              <div className="font-medium">{p.name || p.email}</div>
              <div className="text-xs opacity-80">{p.email}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
