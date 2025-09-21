// app/test-email/page.tsx
import EmailTest from '@/components/EmailTest';

export default function TestEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Email System Testing
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test the EmailJS integration for medication reminders and other notifications.
            This tool helps verify that emails are being sent correctly using your EmailJS configuration.
          </p>
        </div>
        
        <EmailTest />
        
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Email Services</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-green-700 mb-2">Medication Reminders</h3>
              <p className="text-sm text-gray-600">
                Daily reminders for patients to take their prescribed medications at the right time.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                API: <code>/api/notifications/medication-reminders</code>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-blue-700 mb-2">Streak Alerts</h3>
              <p className="text-sm text-gray-600">
                Motivational emails about medication adherence streaks and progress.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                API: <code>/api/notifications/streak-alerts</code>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-purple-700 mb-2">Appointment Reminders</h3>
              <p className="text-sm text-gray-600">
                Reminders for upcoming doctor appointments and consultations.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                API: <code>/api/notifications/appointment-reminders</code>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-orange-700 mb-2">Doctor Alerts</h3>
              <p className="text-sm text-gray-600">
                Alerts to doctors about patient adherence and health status updates.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                API: <code>/api/notifications/doctor-alerts</code>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Enter your email address in the test field above</li>
            <li>Click "Send Test Email" to test the basic EmailJS connection</li>
            <li>Click "Test Medication Reminders" to test the full medication reminder system</li>
            <li>Check your email inbox (and spam folder) for the test emails</li>
            <li>Review the JSON response to see technical details about the email sending</li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-semibold text-yellow-800 mb-2">Note:</h3>
            <p className="text-sm text-yellow-700">
              The medication reminder test will only send emails to patients who actually have medications 
              in their medical profiles and are due for reminders based on the current time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}