// components/doctor/ChatPanel.tsx
'use client';
import { useEffect, useState } from 'react';

export default function ChatPanel({
  doctorId, patientId, patientLabel
}: { doctorId: string; patientId: string; patientLabel: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const threadKey = patientId && doctorId ? `${patientId}:${doctorId}` : '';

  useEffect(() => {
    (async () => {
      if (!threadKey) return;
      const r = await fetch(`/api/messages/thread?key=${encodeURIComponent(threadKey)}`, { cache: 'no-store' });
      if (r.ok) setMessages(await r.json());
    })();
  }, [threadKey]);

  async function send() {
    if (!threadKey || !text.trim()) return;
    const r = await fetch('/api/messages/thread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadKey, body: text })
    });
    if (r.ok) {
      setText('');
      const r2 = await fetch(`/api/messages/thread?key=${encodeURIComponent(threadKey)}`, { cache: 'no-store' });
      if (r2.ok) setMessages(await r2.json());
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-2 text-lg font-semibold text-slate-900">Chat {patientLabel ? `with ${patientLabel}` : ''}</div>
      <div className="h-64 overflow-auto rounded-md border border-slate-200 p-3">
        {messages.map((m:any,i:number)=>(
          <div key={i} className="mb-2 rounded border border-slate-200 p-2 text-sm">
            <div>{m.body}</div>
            <div className="text-xs text-slate-500">{new Date(m.sentAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Type a message"
        />
        <button onClick={send} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Send
        </button>
      </div>
    </div>
  );
}
