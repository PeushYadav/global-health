// components/patient/cards/TodayMedsCard.tsx
'use client';
import { useEffect, useState } from 'react';

export default function TodayMedsCard() {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodaysMedications();
  }, []);

  async function loadTodaysMedications() {
    try {
      const r = await fetch('/api/patient/medication/today', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setMedications(data.meds || []);
      }
    } catch (error) {
      console.error('Failed to load medications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function takeMedication(name: string) {
    try {
      const r = await fetch('/api/patient/medication/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (r.ok) {
        setMedications(prev => 
          prev.map(m => m.name === name ? { ...m, taken: true } : m)
        );
        
        // Trigger calendar update
        window.dispatchEvent(new CustomEvent('medicationTaken'));
      }
    } catch (error) {
      console.error('Failed to mark medication as taken:', error);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900">Today's Medication</div>
        <div className="text-xs text-slate-500">
          {medications.filter(m => m.taken).length} of {medications.length} taken
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-slate-500">Loading medications...</div>
        </div>
      ) : medications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-sm text-slate-500">No medications scheduled for today</div>
          <div className="text-xs text-slate-400 mt-1">Complete your medical profile to add medications</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {medications.map((med: any, index: number) => (
            <li key={index} className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
              med.taken 
                ? 'border-green-200 bg-green-50' 
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}>
              <div className="flex-1">
                <div className={`text-sm font-medium ${med.taken ? 'text-green-800' : 'text-slate-900'}`}>
                  {med.name}
                </div>
                <div className={`text-xs ${med.taken ? 'text-green-600' : 'text-slate-600'}`}>
                  {med.dosage} • {med.timing}
                </div>
              </div>
              
              {med.taken ? (
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-xs font-medium">Taken</span>
                </div>
              ) : (
                <button 
                  onClick={() => takeMedication(med.name)} 
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Take Now
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
