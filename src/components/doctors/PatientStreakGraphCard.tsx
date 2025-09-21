// components/doctors/PatientStreakGraphCard.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface DailyLogEntry {
  date: string;
  medicationsTaken: string[];
  taken: boolean;
  daysSinceCompliance: number;
}

export default function PatientStreakGraphCard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7' | '30' | '60'>('30');

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

  // Fetch patient's daily log data for graph
  useEffect(() => {
    const fetchPatientLogs = async () => {
      if (!selectedPatient) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `/api/doctor/patient-logs/${selectedPatient.id}?range=${dateRange}`, 
          { cache: 'no-store' }
        );
        
        if (response.ok) {
          const logs = await response.json();
          processGraphData(logs);
        }
      } catch (error) {
        console.error('Error fetching patient logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientLogs();
  }, [selectedPatient, dateRange]);

  const processGraphData = (logs: DailyLogEntry[]) => {
    if (!logs || logs.length === 0) {
      setGraphData(null);
      return;
    }

    // Sort logs by date
    const sortedLogs = logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Create labels and data points
    const labels = sortedLogs.map(log => {
      const date = new Date(log.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Calculate adherence percentage for each day
    const adherenceData = sortedLogs.map(log => {
      if (!log.medicationsTaken || log.medicationsTaken.length === 0) return 0;
      // This is simplified - in reality we'd need to know total prescribed meds
      // For now, we'll use whether the day was marked as "taken" or not
      return log.taken ? 100 : 0;
    });

    // Calculate days since compliance for trend line
    const complianceData = sortedLogs.map(log => {
      // Invert the daysSinceCompliance so lower = better
      return Math.max(0, 30 - (log.daysSinceCompliance || 0));
    });

    setGraphData({
      labels,
      datasets: [
        {
          label: 'Daily Adherence %',
          data: adherenceData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Compliance Score',
          data: complianceData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `Medication Adherence Trend (${selectedPatient?.name || 'Patient'})`,
        font: {
          size: 14,
          weight: 'bold' as const
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            if (context.datasetIndex === 0) {
              return `Adherence: ${context.parsed.y}%`;
            } else {
              return `Compliance Score: ${context.parsed.y}/30`;
            }
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12
          }
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Percentage / Score',
          font: {
            size: 12
          }
        },
        min: 0,
        max: 100,
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Patient Health Overview</h3>
          <div className="flex gap-2">
            {['7', '30', '60'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as '7' | '30' | '60')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>
        
        {/* Patient Selector */}
        <div className="mb-4">
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

      {/* Graph Display */}
      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : graphData ? (
        <div className="h-80">
          <Line data={graphData} options={chartOptions} />
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center bg-slate-50 rounded-lg">
          <div className="text-center text-slate-500">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">
              {selectedPatient 
                ? 'No medication data available for this patient' 
                : 'Select a patient to view their adherence trends'}
            </p>
          </div>
        </div>
      )}

      {/* Graph Legend */}
      {graphData && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Daily Adherence: Percentage of medications taken per day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Compliance Score: Overall medication adherence health (30 = perfect)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}