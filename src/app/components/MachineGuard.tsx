'use client';

import { useState, useEffect, ReactNode } from 'react';

interface MachineInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpuModel: string;
  machineId: string;
}

interface VerificationResponse {
  authorized: boolean;
  currentId: string;
  savedId: string | null;
  isFirstRun: boolean;
  message: string;
  machineInfo: MachineInfo;
}

interface MachineGuardProps {
  children: ReactNode;
}

export default function MachineGuard({ children }: MachineGuardProps) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'denied'>('loading');
  const [verificationData, setVerificationData] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      try {
        const response = await fetch('/api/verify-machine');
        const data: VerificationResponse = await response.json();
        
        setVerificationData(data);
        
        if (data.authorized) {
          setStatus('authorized');
        } else {
          setStatus('denied');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
        setStatus('denied');
      }
    }

    verifyAccess();
  }, []);

  // Loading state
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ marginTop: '20px', fontSize: '18px', opacity: 0.8 }}>
          Verifying machine authorization...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Access denied state
  if (status === 'denied') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>
          {/* Lock Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#ef4444',
          }}>
            Access Denied
          </h1>
          
          <p style={{
            fontSize: '16px',
            opacity: 0.8,
            marginBottom: '24px',
            lineHeight: '1.6',
          }}>
            {verificationData?.message || error || 'This application is not authorized to run on this computer.'}
          </p>

          {verificationData && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'left',
              fontSize: '13px',
              marginBottom: '20px',
            }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ opacity: 0.6 }}>Current Machine ID:</span>
                <code style={{
                  display: 'block',
                  marginTop: '4px',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  wordBreak: 'break-all',
                  color: '#fbbf24',
                }}>
                  {verificationData.currentId}
                </code>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ opacity: 0.6 }}>Registered Machine ID:</span>
                <code style={{
                  display: 'block',
                  marginTop: '4px',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  wordBreak: 'break-all',
                  color: '#22c55e',
                }}>
                  {verificationData.savedId || 'Not registered'}
                </code>
              </div>
              <div>
                <span style={{ opacity: 0.6 }}>Computer Name:</span>
                <span style={{ marginLeft: '8px' }}>
                  {verificationData.machineInfo?.hostname || 'Unknown'}
                </span>
              </div>
            </div>
          )}

          <p style={{
            fontSize: '14px',
            opacity: 0.6,
          }}>
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}
