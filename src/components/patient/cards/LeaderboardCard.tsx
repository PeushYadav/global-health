// components/patient/cards/LeaderboardCard.tsx
'use client';
import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  userId: string;
  name: string;
  streak: number;
  score: number;
  rank: number;
  isCurrentUser: boolean;
  lastComplianceDate?: string;
}

export default function LeaderboardCard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/patient/leaderboard', {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      } else {
        setError('Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Listen for medication events to refresh leaderboard
    const handleMedicationEvent = () => {
      // Add a small delay to allow the streak to be recalculated
      setTimeout(fetchLeaderboard, 1000);
    };

    window.addEventListener('medicationTaken', handleMedicationEvent);
    window.addEventListener('medicationAdded', handleMedicationEvent);

    return () => {
      window.removeEventListener('medicationTaken', handleMedicationEvent);
      window.removeEventListener('medicationAdded', handleMedicationEvent);
    };
  }, []);

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getStreakStatus = (streak: number, score: number): { text: string; color: string } => {
    if (score === 0) {
      return { text: 'Needs Support', color: 'text-red-600' };
    } else if (streak === 0) {
      return { text: 'Perfect!', color: 'text-green-600' };
    } else if (streak <= 3) {
      return { text: 'Good', color: 'text-blue-600' };
    } else if (streak <= 10) {
      return { text: 'Improving', color: 'text-orange-600' };
    } else {
      return { text: 'Struggling', color: 'text-red-600' };
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="text-center py-6">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Medication Leaderboard
        </h3>
        <button
          onClick={fetchLeaderboard}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          title="Refresh leaderboard"
        >
          🔄
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <p className="text-sm">No participants yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {leaderboard.map((entry) => {
            const status = getStreakStatus(entry.streak, entry.score);
            const rankIcon = getRankIcon(entry.rank);
            
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  entry.isCurrentUser 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {rankIcon ? (
                    <span className="text-lg">{rankIcon}</span>
                  ) : (
                    <span className="text-sm font-medium text-slate-600">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${
                      entry.isCurrentUser ? 'text-blue-900' : 'text-slate-900'
                    }`}>
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="text-xs text-blue-600 ml-1">(You)</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <span className={status.color}>
                      {status.text}
                    </span>
                    <span className="text-slate-500">
                      {entry.streak === 0 
                        ? 'Perfect streak!' 
                        : `${entry.streak} day${entry.streak > 1 ? 's' : ''} missed`
                      }
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-lg font-bold ${
                    entry.score === 0 
                      ? 'text-red-600' 
                      : entry.score >= 90 
                        ? 'text-green-600' 
                        : entry.score >= 70 
                          ? 'text-blue-600' 
                          : 'text-orange-600'
                  }`}>
                    {entry.score}
                  </div>
                  <div className="text-xs text-slate-500">
                    points
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Info */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <div className="text-xs text-slate-500 space-y-1">
          <p>• Rankings update based on medication adherence</p>
          <p>• Perfect streaks earn 100 points</p>
          <p>• Missing 30+ days resets score to 0</p>
        </div>
      </div>
    </div>
  );
}