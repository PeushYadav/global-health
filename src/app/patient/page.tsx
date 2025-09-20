// app/patient/page.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { connectDB } from '@/lib/db';
import { MedicalProfile } from '@/models/MedicalProfile';
import { User } from '@/models/User';
import Dashboard from '@/components/patient/Dashboard';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getPatient() {
  const token = cookies().get('auth')?.value;
  if (!token) redirect('/login');
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if ((payload as any).role !== 'patient') redirect('/doctor');
    return payload as { sub: string; email: string; role: 'patient' };
  } catch {
    redirect('/login');
  }
}

export default async function PatientHome() {
  const user = await getPatient();
  await connectDB();
  const exists = await MedicalProfile.exists({ user: user.sub });
  const u = await User.findById(user.sub).lean();
  const firstName = (u?.name || user.email || '').split(' ')[0];

  return (
    <>
      <Navbar />
      <Dashboard userId={user.sub} userEmail={String(user.email)} firstName={firstName} hasProfile={!!exists} />
    </>
  );
}
