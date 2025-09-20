// app/patient/page.tsx
import Navbar from '@/components/navbar';
import DashboardDemo from '@/components/patient/DashboardDemo';

export default async function PatientDemoPage() {
  return (
    <>
      <Navbar />
      <DashboardDemo />
    </>
  );
}
