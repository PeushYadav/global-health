// app/doctor/page.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getDoctor() {
  const token = cookies().get('auth')?.value;
  if (!token) redirect('/login');
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== 'doctor') redirect('/patient');
    return payload;
  } catch {
    redirect('/login');
  }
}

export default async function DoctorHome() {
  const user = await getDoctor();
  return <div>Doctor dashboard for {String(user.email)}</div>;
}
