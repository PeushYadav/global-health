// app/patient/page.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

async function getPatient() {
  const token = cookies().get('auth')?.value;
  if (!token) redirect('/login');
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== 'patient') redirect('/doctor');
    return payload;
  } catch {
    redirect('/login');
  }
}

export default async function PatientHome() {
  const user = await getPatient();
  return <div>Patient dashboard for {String(user.email)}</div>;
}
