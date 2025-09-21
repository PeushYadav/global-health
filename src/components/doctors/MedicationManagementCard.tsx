// components/doctors/MedicationManagementCard.tsx
'use client';
import { useEffect, useState } from 'react';

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
}

interface MedicalProfile {
  medications: Medication[];
  allergies: string[];
  conditions: string[];
}

export default function MedicationManagementCard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<number | false>(false);
  const [newMedication, setNewMedication] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    instructions: ''
  });

  // Fetch all patients under this doctor
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/doctor/patients', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
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

  // Fetch selected patient's medical profile
  useEffect(() => {
    const fetchMedicalProfile = async () => {
      if (!selectedPatient) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/doctor/patient-profile/${selectedPatient.id}`, {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const profile = await response.json();
          setMedicalProfile(profile);
        } else {
          // If no profile exists, initialize with empty structure
          setMedicalProfile({
            medications: [],
            allergies: [],
            conditions: []
          });
        }
      } catch (error) {
        console.error('Error fetching medical profile:', error);
        setMedicalProfile({
          medications: [],
          allergies: [],
          conditions: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalProfile();
  }, [selectedPatient]);

  const handleAddMedication = async () => {
    if (!selectedPatient || !newMedication.name.trim()) {
      alert('Please fill in medication name');
      return;
    }

    try {
      const updatedMedications = [
        ...(medicalProfile?.medications || []),
        newMedication
      ];

      const response = await fetch(`/api/doctor/patient-profile/${selectedPatient.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medications: updatedMedications
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setMedicalProfile(updatedProfile);
        setNewMedication({ name: '', dosage: '', frequency: '', instructions: '' });
        alert('Medication added successfully!');
        
        // Trigger refresh events for other components
        window.dispatchEvent(new CustomEvent('medicationUpdated'));
      } else {
        const error = await response.json();
        alert(`Failed to add medication: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Failed to add medication. Please try again.');
    }
  };

  const handleRemoveMedication = async (index: number) => {
    if (!selectedPatient || !medicalProfile) return;

    const medicationName = medicalProfile.medications[index]?.name;
    if (!confirm(`Are you sure you want to remove "${medicationName}" from ${selectedPatient.name}'s prescription?`)) {
      return;
    }

    try {
      const updatedMedications = medicalProfile.medications.filter((_, i) => i !== index);

      const response = await fetch(`/api/doctor/patient-profile/${selectedPatient.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medications: updatedMedications
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setMedicalProfile(updatedProfile);
        alert('Medication removed successfully!');
        
        // Trigger refresh events
        window.dispatchEvent(new CustomEvent('medicationUpdated'));
      } else {
        const error = await response.json();
        alert(`Failed to remove medication: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing medication:', error);
      alert('Failed to remove medication. Please try again.');
    }
  };

  const handleUpdateMedication = async (index: number, updatedMed: Medication) => {
    if (!selectedPatient || !medicalProfile) return;

    try {
      const updatedMedications = [...medicalProfile.medications];
      updatedMedications[index] = updatedMed;

      const response = await fetch(`/api/doctor/patient-profile/${selectedPatient.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medications: updatedMedications
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setMedicalProfile(updatedProfile);
        setEditMode(false);
        alert('Medication updated successfully!');
        
        // Trigger refresh events
        window.dispatchEvent(new CustomEvent('medicationUpdated'));
      } else {
        const error = await response.json();
        alert(`Failed to update medication: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating medication:', error);
      alert('Failed to update medication. Please try again.');
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Medication Management</h3>
        
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
              setEditMode(false);
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

      {/* Patient Medication Management */}
      {selectedPatient && (
        <div className="border-t border-slate-200 pt-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-sm font-medium text-slate-900">{selectedPatient.name}</div>
                <div className="text-xs text-slate-600">{selectedPatient.email}</div>
              </div>

              {/* Current Medications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-slate-900">Current Medications</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {medicalProfile?.medications?.length || 0} prescribed
                  </span>
                </div>

                {medicalProfile?.medications && medicalProfile.medications.length > 0 ? (
                  <div className="space-y-2">
                    {medicalProfile.medications.map((med, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">{med.name}</div>
                            {med.dosage && (
                              <div className="text-xs text-slate-600">Dosage: {med.dosage}</div>
                            )}
                            {med.frequency && (
                              <div className="text-xs text-slate-600">Frequency: {med.frequency}</div>
                            )}
                            {med.instructions && (
                              <div className="text-xs text-slate-600 mt-1">
                                Instructions: {med.instructions}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => setEditMode(editMode === index ? false : index)}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                            >
                              {editMode === index ? 'Cancel' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleRemoveMedication(index)}
                              className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Edit Mode */}
                        {editMode === index && (
                          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                            <MedicationForm
                              medication={med}
                              onSave={(updatedMed) => handleUpdateMedication(index, updatedMed)}
                              onCancel={() => setEditMode(false)}
                              saveButtonText="Update Medication"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg">
                    <div className="text-2xl mb-2">💊</div>
                    <p className="text-sm">No medications prescribed</p>
                    <p className="text-xs">Add a medication below to get started</p>
                  </div>
                )}
              </div>

              {/* Add New Medication */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-md font-medium text-slate-900 mb-3">Add New Medication</h4>
                <MedicationForm
                  medication={newMedication}
                  onSave={handleAddMedication}
                  onCancel={() => setNewMedication({ name: '', dosage: '', frequency: '', instructions: '' })}
                  saveButtonText="Add Medication"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Reusable medication form component
function MedicationForm({ 
  medication, 
  onSave, 
  onCancel, 
  saveButtonText 
}: { 
  medication: Medication;
  onSave: (med: Medication) => void;
  onCancel: () => void;
  saveButtonText: string;
}) {
  const [formData, setFormData] = useState(medication);

  useEffect(() => {
    setFormData(medication);
  }, [medication]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Medication Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Lisinopril"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Dosage
          </label>
          <input
            type="text"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            placeholder="e.g., 10mg"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Frequency
        </label>
        <input
          type="text"
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          placeholder="e.g., Once daily, Twice daily, Every 8 hours"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Instructions
        </label>
        <textarea
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="e.g., Take with food, Take at bedtime"
          rows={2}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSave(formData)}
          disabled={!formData.name.trim()}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saveButtonText}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}