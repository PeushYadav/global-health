// app/doctor/page.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/doctors/Dashboard';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getDoctor() {
  const token = cookies().get('auth')?.value;
  if (!token) redirect('/login');
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if ((payload as any).role !== 'doctor') redirect('/patient');
    return payload as { sub: string; email: string; role: 'doctor' };
  } catch {
    redirect('/login');
  }
}

export default async function DoctorHome() {
  const doc = await getDoctor();
  await connectDB();
  const u = await User.findById(doc.sub).lean();
  const firstName = (u?.name || doc.email || '').split(' ')[0];

  return (
    <>
      <Navbar />
      <Dashboard doctorId={doc.sub} doctorEmail={String(doc.email)} firstName={firstName} />
    </>
  );
}
