// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

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
      if (res.status === 409) {
        alert('User already exists');
      } else {
        alert('Registration failed');
      }
      return;
    }

    const data = await res.json();
    const role = data?.user?.role;
    router.push(role === 'doctor' ? '/doctor' : '/patient');
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <section className="mx-auto flex max-w-7xl items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="mb-6 text-center text-2xl font-semibold text-slate-800">Create account</h1>

            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="role" className="text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'doctor' | 'patient' })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Create account
              </button>

              <p className="pt-2 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-medium text-slate-900 underline underline-offset-4 hover:no-underline"
                >
                  Login
                </a>
              </p>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
