import React from 'react';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-20 w-20 text-red-500 mx-auto" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          This device is not authorized to access this application.
        </p>
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded border border-gray-200">
          <p>
            This system is restricted to authorized office computers only.
            If you believe this is an error, please contact the administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
