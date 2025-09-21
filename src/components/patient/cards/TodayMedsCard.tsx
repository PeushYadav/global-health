// components/patient/cards/TodayMedsCard.tsx
'use client';
import { useEffect, useState } from 'react';

interface Medication {
  name: string;
  dosage: string;
  timing: string;
  taken: boolean;
}

export default function TodayMedsCard() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    timing: ''
  });
  const [addingMedication, setAddingMedication] = useState(false);

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

  async function addMedication() {
    if (!newMedication.name || !newMedication.dosage || !newMedication.timing) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setAddingMedication(true);
      const r = await fetch('/api/patient/medication/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedication)
      });
      
      if (r.ok) {
        // Reset form
        setNewMedication({ name: '', dosage: '', timing: '' });
        setShowAddForm(false);
        
        // Reload medications
        await loadTodaysMedications();
        
        // Trigger medication list update event
        window.dispatchEvent(new CustomEvent('medicationAdded'));
      } else {
        const error = await r.json();
        alert(error.message || 'Failed to add medication');
      }
    } catch (error) {
      console.error('Failed to add medication:', error);
      alert('Failed to add medication');
    } finally {
      setAddingMedication(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900">Today's Medication</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500">
            {medications.filter(m => m.taken).length} of {medications.length} taken
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Add Medication Form */}
      {showAddForm && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Add New Medication</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="e.g., Aspirin, Metformin"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">
                Dosage *
              </label>
              <input
                type="text"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="e.g., 100mg, 2 tablets"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">
                Timing *
              </label>
              <select
                value={newMedication.timing}
                onChange={(e) => setNewMedication(prev => ({ ...prev, timing: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              >
                <option value="">Select timing</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
                <option value="With meals">With meals</option>
                <option value="Before meals">Before meals</option>
                <option value="After meals">After meals</option>
                <option value="As needed">As needed</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={addMedication}
                disabled={addingMedication}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
              >
                {addingMedication ? 'Adding...' : 'Add Medication'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-slate-500">Loading medications...</div>
        </div>
      ) : medications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-sm text-slate-500">No medications scheduled for today</div>
          <div className="text-xs text-slate-400 mt-1">
            {showAddForm ? 'Fill the form above to add your first medication' : 'Click "Add" to add your first medication'}
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {medications.map((med: Medication, index: number) => (
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
