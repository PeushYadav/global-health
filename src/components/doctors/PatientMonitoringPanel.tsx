// components/doctors/PatientMonitoringPanel.tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface PatientStreakData {
  daysSinceFullCompliance: number;
  lastFullComplianceDate: string | null;
  totalDaysTracked: number;
  todaysProgress: {
    taken: number;
    total: number;
    complete: boolean;
  };
  medications: string[];
}

export default function PatientMonitoringPanel() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [streakData, setStreakData] = useState<PatientStreakData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all patients under this doctor
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/doctor/patients', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
          // Auto-select first patient if available
          if (data.length > 0) {
            setSelectedPatient(data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, []);

  // Fetch selected patient's medication adherence data
  useEffect(() => {
    const fetchPatientStreak = async () => {
      if (!selectedPatient) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/doctor/patient-streak/${selectedPatient.id}`, {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setStreakData(data);
        }
      } catch (error) {
        console.error('Error fetching patient streak:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientStreak();
  }, [selectedPatient]);

  // Map days since compliance to day images (same logic as patient dashboard)
  const getDayImage = (days: number): string => {
    if (days === 0) return '/day0.png';
    
    const cappedDays = Math.min(days, 30);
    const dayImage = Math.min(Math.ceil(cappedDays / 3) * 3, 30);
    
    const availableImages = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
    const closestImage = availableImages.find(day => day >= dayImage) || 30;
    
    return closestImage === 0 ? '/day0.png' : `/day${closestImage}.svg`;
  };

  const getAdherenceLevel = (days: number): { level: string; color: string; description: string } => {
    if (days === 0) {
      return { level: 'EXCELLENT', color: 'text-green-600', description: 'Perfect medication adherence' };
    } else if (days <= 3) {
      return { level: 'GOOD', color: 'text-blue-600', description: 'Minor lapses, generally compliant' };
    } else if (days <= 7) {
      return { level: 'MODERATE', color: 'text-yellow-600', description: 'Some adherence issues, needs attention' };
    } else if (days <= 15) {
      return { level: 'POOR', color: 'text-orange-600', description: 'Significant adherence problems' };
    } else {
      return { level: 'CRITICAL', color: 'text-red-600', description: 'Severe non-compliance, immediate intervention needed' };
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Patient Medication Monitor</h3>
        
        {/* Patient Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Patient
          </label>
          <select
            value={selectedPatient?.id || ''}
            onChange={(e) => {
              const patient = patients.find(p => p.id === e.target.value);
              setSelectedPatient(patient || null);
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Choose a patient...</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} ({patient.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Adherence Display */}
      {selectedPatient && (
        <div className="border-t border-slate-200 pt-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : streakData ? (
            <div className="space-y-4">
              {/* Patient Info Header */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-sm font-medium text-slate-900">{selectedPatient.name}</div>
                <div className="text-xs text-slate-600">{selectedPatient.email}</div>
              </div>

              {/* Redman Visual */}
              <div className="text-center">
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <Image
                    src={getDayImage(streakData.daysSinceFullCompliance)}
                    alt={`Patient adherence day ${streakData.daysSinceFullCompliance}`}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Adherence Level */}
                {(() => {
                  const adherence = getAdherenceLevel(streakData.daysSinceFullCompliance);
                  return (
                    <div className="mb-4">
                      <div className={`text-lg font-bold ${adherence.color}`}>
                        {adherence.level}
                      </div>
                      <div className="text-sm text-slate-600">
                        {adherence.description}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {streakData.daysSinceFullCompliance}
                  </div>
                  <div className="text-xs text-red-700">
                    Days Since Full Compliance
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {streakData.todaysProgress.taken}/{streakData.todaysProgress.total}
                  </div>
                  <div className="text-xs text-blue-700">
                    Today's Medications
                  </div>
                </div>
              </div>

              {/* Current Medications */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-sm font-medium text-slate-900 mb-2">
                  Prescribed Medications
                </div>
                {streakData.medications && streakData.medications.length > 0 ? (
                  <div className="space-y-1">
                    {streakData.medications.map((med, index) => (
                      <div key={index} className="text-xs text-slate-600 bg-white rounded px-2 py-1">
                        {med}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    No medications prescribed
                  </div>
                )}
              </div>

              {/* Last Compliance Date */}
              {streakData.lastFullComplianceDate && (
                <div className="text-center text-xs text-slate-500">
                  Last perfect day: {new Date(streakData.lastFullComplianceDate).toLocaleDateString()}
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => {
                    // Refresh patient data
                    setSelectedPatient(selectedPatient);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh Data
                </button>
                <button
                  onClick={() => {
                    // Could implement medication adjustment here
                    alert('Medication management coming soon!');
                  }}
                  className="flex-1 px-3 py-2 bg-slate-600 text-white text-xs font-medium rounded-md hover:bg-slate-700 transition-colors"
                >
                  Adjust Meds
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No adherence data available</p>
              <p className="text-xs mt-1">Patient may not have started medication tracking</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}