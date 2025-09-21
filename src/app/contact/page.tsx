'use client';

import Navbar from '@/components/navbar';

export default function ContactPage() {
  const handleEmailClick = () => {
    window.location.href = 'mailto:shashwatrivedi2005@gmail.com';
  };

  return (
    <div className='bg-white w-screen h-screen overflow-x-hidden font-[aspekta]'>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 md:px-20 py-10 my-5">
        {/* Main Card */}
        <div className="bg-gray-100 rounded-3xl shadow-xl p-6 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-normal text-black mb-4">
              Get in <span className="font-bold">Touch</span>
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              <div>
                <label htmlFor="message" className="block text-lg font-medium text-black mb-2">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-400 focus:outline-none focus:border-black resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <button
                onClick={handleEmailClick}
                className="w-full px-6 py-3 bg-teal-200 text-black font-medium hover:bg-teal-300 transition-colors"
              >
                Send Email
              </button>
            </div>

            <div className="mt-8 pt-8 text-center">
              <p className="text-gray-600 text-lg">
                Or email us directly at:{' '}
                <a
                  href="mailto:shashwatrivedi2005@gmail.com"
                  className="text-black font-medium hover:text-gray-600"
                >
                  shashwatrivedi2005@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Simple Info Section */}
        <div className="mt-10 text-center">
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
            <div className="text-center">
              <h3 className="text-xl font-medium text-black mb-2">Quick Response</h3>
              <p className="text-gray-600">We respond within 24 hours</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-black mb-2">Support</h3>
              <p className="text-gray-600">Get help with any questions</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-black mb-2">Feedback</h3>
              <p className="text-gray-600">Help us improve MedTrack</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}