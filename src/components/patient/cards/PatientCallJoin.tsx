'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientCallJoin() {
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const joinCall = () => {
    if (!roomId.trim()) return;
    
    setIsJoining(true);
    router.push(`/patient/call?roomId=${roomId.trim()}`);
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-lg font-semibold text-slate-900">Join Video Call</div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Call Room ID</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID from your doctor"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && joinCall()}
          />
        </div>
        <button
          onClick={joinCall}
          disabled={!roomId.trim() || isJoining}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isJoining ? 'Joining...' : 'Join Video Call'}
        </button>
        <p className="text-xs text-slate-500">
          Your doctor will provide you with a room ID to join the video call.
        </p>
      </div>
    </div>
  );
}