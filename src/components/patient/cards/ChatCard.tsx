// components/patient/cards/ChatCard.tsx
'use client';
import { useEffect, useState } from 'react';

export default function ChatCard() {
  const [threads,setThreads]=useState<any[]>([]);
  const [active,setActive]=useState('');
  const [messages,setMessages]=useState<any[]>([]);
  const [text,setText]=useState('');
  const [streak,setStreak]=useState(0);

  useEffect(()=>{(async()=>{
    // Calculate login streak instead of medication streak
    const streakRes = await fetch('/api/patient/login-activity?type=streak', {cache:'no-store'});
    if(streakRes.ok) { 
      const streakData = await streakRes.json(); 
      setStreak(streakData.streak || 0);
    }
    
    const t=await fetch('/api/messages/threads',{cache:'no-store'}); if(t.ok) setThreads(await t.json());
  })();},[]);

  useEffect(()=>{(async()=>{ if(!active) return; const r=await fetch(`/api/messages/thread?key=${encodeURIComponent(active)}`,{cache:'no-store'}); if(r.ok) setMessages(await r.json()); })();},[active]);

  async function send(){
    if(!active || !text.trim()) return;
    const r=await fetch('/api/messages/thread',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({threadKey:active,body:text})});
    if(r.ok){ setText(''); const r2=await fetch(`/api/messages/thread?key=${encodeURIComponent(active)}`,{cache:'no-store'}); if(r2.ok) setMessages(await r2.json()); }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className={`mb-2 text-center text-sm font-medium rounded-md py-1 ${
        streak === 0 
          ? "text-slate-700 bg-slate-100"
          : streak < 7 
            ? "text-green-700 bg-green-100"
            : streak < 30 
              ? "text-blue-700 bg-blue-100"
              : "text-purple-700 bg-purple-100"
      }`}>
        {streak === 0 
          ? "Start your login streak today!" 
          : streak === 1 
            ? "Great start! You have a 1 day login streak!" 
            : `You are doing great with ${streak} day login streak!`
        }
      </div>
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="mb-2 text-sm font-medium text-slate-800">Doctors</div>
          <ul className="grid gap-2">
            {threads.map((t:any,i:number)=>(
              <li key={i}>
                <button onClick={()=>setActive(t.threadKey)} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${active===t.threadKey?'border-slate-900 bg-slate-900 text-white':'border-slate-300'}`}>{t.label}</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-8">
          <div className="h-48 overflow-auto rounded-md border border-slate-200 p-2">
            {messages.map((m:any,i:number)=>(
              <div key={i} className="mb-2 rounded border border-slate-200 p-2 text-sm">
                <div>{m.body}</div>
                <div className="text-xs text-slate-500">{new Date(m.sentAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Type a message"/>
            <button onClick={send} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

