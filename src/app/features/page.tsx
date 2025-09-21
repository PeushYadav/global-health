'use client';

import Navbar from '@/components/navbar';

export default function FeaturesPage() {
  const features = [
    {
      title: "Red Man Health Tracking",
      description: "Monitor your health status with our interactive red man visualization. Track vital signs, symptoms, and overall wellness in real-time.",
    },
    {
      title: "Streak System",
      description: "Build healthy habits with our gamified streak system. Earn points for daily login streaks and consistent medication taking.",
    },
    {
      title: "Health Leaderboard",
      description: "Compete with other patients in a friendly health competition. Track your progress against others.",
    },
    {
      title: "Appointment Management",
      description: "Patients can easily book appointments with healthcare providers. Doctors have full control to cancel and reschedule.",
    },
    {
      title: "Doctor Dashboard Analytics",
      description: "Comprehensive patient monitoring with red man health visualizations and daily activity tracking for every patient.",
    },
    {
      title: "AYU - AI Chatbot Assistant",
      description: "Meet AYU, your intelligent healthcare assistant. Available for both doctors and patients to explain medications and provide guidance.",
    },
    {
      title: "Video Consultations",
      description: "Seamless video calling for scheduled appointments. Doctors can initiate video calls and patients can join instantly.",
    },
    {
      title: "Medication Tracking",
      description: "Never miss a dose with our smart medication tracking system. Set reminders, track adherence, and build healthy habits.",
    }
  ];

  return (
    <div className='bg-white w-screen h-screen overflow-x-hidden font-[aspekta]'>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 md:px-20 py-10 my-5">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-normal text-black mb-4">
            Powerful <span className="font-bold">Features</span>
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            MedTrack combines cutting-edge technology with intuitive design to revolutionize healthcare management.
          </p>
        </div>

        {/* Features Grid */}
        <div className="bg-gray-100 rounded-3xl shadow-xl p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <h3 className="inline-block px-4 py-1 mb-4 text-lg font-medium border border-gray-400 rounded-full">
                  {feature.title}
                </h3>
                <p className="text-gray-700 text-left leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-10 text-center">
          <h2 className="text-3xl font-normal text-black mb-6">
            Ready to Transform Your <span className="font-bold">Healthcare</span>?
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Join thousands of patients and healthcare providers using MedTrack to improve health outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="px-6 py-2 rounded-full bg-teal-200 text-black font-medium hover:bg-teal-300 transition-colors"
            >
              Get Started Today
            </a>
            <a
              href="/contact"
              className="px-6 py-2 rounded-full border border-gray-400 text-black font-medium hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Simple Stats */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-black mb-2">24/7</div>
            <div className="text-gray-600">Health Monitoring</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-black mb-2">AI-Powered</div>
            <div className="text-gray-600">AYU Assistant</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-black mb-2">Real-Time</div>
            <div className="text-gray-600">Video Consultations</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-black mb-2">Smart</div>
            <div className="text-gray-600">Medication Tracking</div>
          </div>
        </div>
      </div>
    </div>
  );
}