'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProvisionPage() {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('Device authorized successfully! Redirecting...');
        // Wait a moment so the user sees the success message
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setStatus('error');
        setMessage(data.message || 'Authorization failed');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center">Device Provisioning</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-400 mb-1">
              Admin Key
            </label>
            <input
              type="password"
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin key..."
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full py-2 px-4 rounded font-medium transition-colors ${
              status === 'loading'
                ? 'bg-blue-800 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {status === 'loading' ? 'Authorizing...' : 'Authorize Device'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded text-center text-sm ${
            status === 'success' ? 'bg-green-900/50 text-green-200 border border-green-800' : 
            status === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : ''
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
