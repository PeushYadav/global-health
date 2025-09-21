// app/doctor/page.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navbar';
import { connectDB } from '@/lib/db';
import Dashboard from '@/components/doctors/Dashboard';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getDoctor() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) redirect('/login');
  
  const { payload } = await jwtVerify(token, SECRET).catch(() => ({ payload: null }));
  if (!payload) redirect('/login');
  if ((payload as any).role !== 'doctor') redirect('/patient');
  
  return payload as { sub: string; email: string; role: 'doctor' };
}

export default async function DoctorHome() {
  const user = await getDoctor();
  await connectDB();

  return (
    <>
      <Navbar />
      <Dashboard 
        doctorId={user.sub} 
        doctorEmail={String(user.email)} 
        firstName={String(user.email).split('@')[0]} 
      />
    </>
  );
}
