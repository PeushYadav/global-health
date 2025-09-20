'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      alert('Registration failed');
      return;
    }

    const data = await res.json();
    const role = data?.user?.role;
    router.push(role === 'doctor' ? '/doctor' : '/patient');
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <h1>Register</h1>
      <input placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'doctor' | 'patient' })}>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>
      <button type="submit">Create account</button>
    </form>
  );
}