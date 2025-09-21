// components/patient/cards/MedicationStreakCard.tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface StreakData {
  daysSinceFullCompliance: number;
  lastFullComplianceDate: string | null;
  totalDaysTracked: number;
  todaysProgress: {
    taken: number;
    total: number;
    complete: boolean;
  };
}

export default function MedicationStreakCard() {
  const [streakData, setStreakData] = useState<StreakData>({
    daysSinceFullCompliance: 0,
    lastFullComplianceDate: null,
    totalDaysTracked: 0,
    todaysProgress: { taken: 0, total: 0, complete: false }
  });
  const [loading, setLoading] = useState(true);

  // Map days since compliance to day images (every 3 days, max 30)
  const getDayImage = (days: number): string => {
    if (days === 0) return '/day0.svg';
    
    // Cap at day 30 and round to nearest multiple of 3
    const cappedDays = Math.min(days, 30);
    const dayImage = Math.min(Math.ceil(cappedDays / 3) * 3, 30);
    
    // Handle the mapping for available images
    const availableImages = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
    const closestImage = availableImages.find(day => day >= dayImage) || 30;
    
    return closestImage === 0 ? '/day0.png' : `/day${closestImage}.svg`;
  };

  const getStreakMessage = (days: number, todaysProgress: any): { title: string; subtitle: string; color: string } => {
    if (days === 0 && todaysProgress.complete) {
      return {
        title: "Perfect Streak!",
        subtitle: "All medications taken today",
        color: "text-green-600"
      };
    } else if (days === 0) {
      return {
        title: "Great Progress!",
        subtitle: `${todaysProgress.taken}/${todaysProgress.total} medications taken today`,
        color: "text-blue-600"
      };
    } else if (days <= 3) {
      return {
        title: "Stay Strong",
        subtitle: `${days} day${days > 1 ? 's' : ''} since full compliance`,
        color: "text-yellow-600"
      };
    } else if (days <= 10) {
      return {
        title: "Get Back on Track",
        subtitle: `${days} days since taking all medications`,
        color: "text-orange-600"
      };
    } else {
      return {
        title: "Need Support",
        subtitle: `${days} days - let's restart your routine`,
        color: "text-red-600"
      };
    }
  };

  const fetchStreakData = async () => {
    try {
      const response = await fetch('/api/patient/medication-streak-daily', {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for medication taken events from TodayMedsCard
  useEffect(() => {
    const handleMedicationTaken = () => {
      fetchStreakData();
    };

    const handleMedicationAdded = () => {
      fetchStreakData();
    };

    window.addEventListener('medicationTaken', handleMedicationTaken);
    window.addEventListener('medicationAdded', handleMedicationAdded);
    fetchStreakData();

    return () => {
      window.removeEventListener('medicationTaken', handleMedicationTaken);
      window.removeEventListener('medicationAdded', handleMedicationAdded);
    };
  }, []);

  const streakMessage = getStreakMessage(streakData.daysSinceFullCompliance, streakData.todaysProgress);
  const dayImage = getDayImage(streakData.daysSinceFullCompliance);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      {/* Day Image Display */}
      <div className="flex justify-center mb-6">
        <div className="relative w-80 h-80">
          <Image
            src={dayImage}
            alt={`Medication adherence day ${streakData.daysSinceFullCompliance}`}
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Streak Information */}
      <div className="text-center mb-4">
        <h3 className={`text-lg font-semibold ${streakMessage.color}`}>
          {streakMessage.title}
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          {streakMessage.subtitle}
        </p>
      </div>

      {/* Days Counter */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-slate-900">
          {streakData.daysSinceFullCompliance}
        </div>
        <div className="text-xs text-slate-500">
          {streakData.daysSinceFullCompliance === 0 ? 'Perfect adherence today!' : 'Days since full compliance'}
        </div>
      </div>

      {/* Today's Progress */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4 w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700 truncate">Today's Progress</span>
          <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${streakData.todaysProgress.complete ? 'text-green-600' : 'text-orange-600'}`}>
            {streakData.todaysProgress.taken}/{streakData.todaysProgress.total}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              streakData.todaysProgress.complete ? 'bg-green-500' : 'bg-orange-500'
            }`}
            style={{ 
              width: streakData.todaysProgress.total > 0 
                ? `${Math.min((streakData.todaysProgress.taken / streakData.todaysProgress.total) * 100, 100)}%` 
                : '0%' 
            }}
          ></div>
        </div>
      </div>

      {/* Additional Info */}
      {streakData.lastFullComplianceDate && (
        <div className="text-center text-xs text-slate-500">
          Last perfect day: {new Date(streakData.lastFullComplianceDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}