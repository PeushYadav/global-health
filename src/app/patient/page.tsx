// app/patient/page.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { connectDB } from '@/lib/db';
import { MedicalProfile } from '@/models/MedicalProfile';
import PatientIntakeForm from '@/components/PatientIntakeForm'; // client component is OK to import here
import Dashboard from '@/components/patient/Dashboard';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getPatient() {
  const token = cookies().get('auth')?.value;
  if (!token) redirect('/login');
  const { payload } = await jwtVerify(token, SECRET).catch(() => ({ payload: null }));
  if (!payload) redirect('/login');
  if ((payload as any).role !== 'patient') redirect('/doctor');
  return payload as { sub: string; email: string; role: 'patient' };
}

export default async function PatientHome() {
  const user = await getPatient();
  await connectDB();  
  const exists = await MedicalProfile.exists({ user: user.sub });

  if (!exists) {
    // FIRST VISIT: show medical intake form instead of dashboard
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
          <section className="mx-auto flex max-w-7xl items-start justify-center px-4 py-10">
            <PatientIntakeForm />
          </section>
        </main>
      </>
    );
  }

  // RETURNING: show full dashboard
  return (
    <>
      <Navbar />
      <Dashboard userId={user.sub} userEmail={String(user.email)} firstName={String(user.email).split('@')[0]} hasProfile={true} />
    </>
  );
}
