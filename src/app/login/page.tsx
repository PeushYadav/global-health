'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      alert('Invalid credentials');
      return;
    }

    const data = await res.json();
    const role = data?.user?.role;
    router.push(role === 'doctor' ? '/doctor' : '/patient');
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <h1>Login</h1>
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}