// components/EmailTest.tsx
'use client';

import React, { useState } from 'react';

export default function EmailTest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testEmailJS = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/notifications/test-emailjs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        setError('');
      } else {
        setError(data.error || 'Failed to send test email');
        setResult(data);
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const testMedicationReminder = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // First, we need to create a test patient with medications
      // For now, let's just trigger the general medication reminders
      const response = await fetch('/api/notifications/medication-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Send to all patients
      });

      const data = await response.json();
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Failed to send medication reminders');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">EmailJS Test</h2>
      
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Test Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email address"
        />
      </div>

      <div className="space-y-3 mb-6">
        <button
          onClick={testEmailJS}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>

        <button
          onClick={testMedicationReminder}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Test Medication Reminders'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-md ${result.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">EmailJS Configuration:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><strong>Service ID:</strong> service_jxh3u5o</li>
          <li><strong>Template ID:</strong> template_g3saswe</li>
          <li><strong>Public Key:</strong> aZzPa1SSl5c4qnLxH</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold mb-2 text-blue-800">Template Parameters:</h3>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• user_name</li>
          <li>• email</li>
          <li>• title</li>
          <li>• medicine_name</li>
          <li>• dosage</li>
          <li>• time</li>
        </ul>
      </div>
    </div>
  );
}