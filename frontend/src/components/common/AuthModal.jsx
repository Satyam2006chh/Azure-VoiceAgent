import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginUser,
    registerUserWithOtp,
    user
  } = useApp();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // UI / Async State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Email classification
  const isChitkaraEmail = email.trim().toLowerCase().endsWith('@chitkara.edu.in');

  // ── CRITICAL FIX: Reset ALL state whenever modal opens ──────────────────
  // This ensures clicking Sign In / Register NEVER shows a stale OTP screen
  // and the form is always clean on every open.
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('form');
      setOtp('');
      setErrorMessage('');
      setSuccessMessage('');
      setLoading(false);
      setName('');
      setEmail('');
      setPassword('');
      setResendCooldown(0);
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  const safeParseResponse = async (resp) => {
    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch {
      return { detail: text || `Server error (HTTP ${resp.status})` };
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (activeTab === 'register' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
      const resp = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password
        })
      });
      const data = await safeParseResponse(resp);

      if (!resp.ok) {
        throw new Error(data.detail?.message || data.detail || 'Failed to send OTP email.');
      }

      setStep('otp');
      setResendCooldown(60);
      setSuccessMessage(`A 6-digit verification code has been sent to ${email}. Please check your inbox!`);
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (otp.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
      const resp = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim()
        })
      });
      const data = await safeParseResponse(resp);

      if (!resp.ok) {
        throw new Error(data.detail?.message || data.detail || 'Invalid OTP code.');
      }

      // Successful registration
      registerUserWithOtp(data.token, data.user);
      resetState();
      closeAuthModal();
    } catch (err) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
      const resp = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });
      const data = await safeParseResponse(resp);

      if (!resp.ok) {
        throw new Error(data.detail?.message || data.detail || 'Invalid email or password.');
      }

      loginUser(data.token, data.user);
      resetState();
      closeAuthModal();
    } catch (err) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep('form');
    setName('');
    setEmail('');
    setPassword('');
    setOtp('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="auth-modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(5, 10, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      padding: '20px'
    }}>
      <div className="auth-modal-card" style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(37, 99, 235, 0.2)',
        overflow: 'hidden',
        animation: 'fadeIn 0.25s ease-out',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 26px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
            }}>
              🎙️
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                UniVoice Identity Gate
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                AI-Powered Multilingual Voice Assistant
              </p>
            </div>
          </div>
          
          {/* Always Available Close Button */}
          <button
            onClick={closeAuthModal}
            aria-label="Close modal"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#cbd5e1',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        {step === 'form' && (
          <div style={{
            display: 'flex',
            padding: '6px',
            margin: '16px 26px 0',
            backgroundColor: 'rgba(30, 41, 59, 0.65)',
            borderRadius: '12px'
          }}>
            <button
              onClick={() => { setActiveTab('register'); resetState(); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'register' ? '#2563eb' : 'transparent',
                color: activeTab === 'register' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'register' ? '0 2px 10px rgba(37,99,235,0.4)' : 'none'
              }}
            >
              Register (New User)
            </button>
            <button
              onClick={() => { setActiveTab('login'); resetState(); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'login' ? '#2563eb' : 'transparent',
                color: activeTab === 'login' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'login' ? '0 2px 10px rgba(37,99,235,0.4)' : 'none'
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Body Content */}
        <div style={{ padding: '20px 26px 26px' }}>
          {/* Messages */}
          {errorMessage && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              color: '#34d399',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              ✅ {successMessage}
            </div>
          )}

          {/* TAB: REGISTER / SIGN UP */}
          {activeTab === 'register' && step === 'form' && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Satyam Chhabra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name.branch@chitkara.edu.in or personal@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Dynamic Role Recognition Banner */}
              {email.includes('@') && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: isChitkaraEmail ? 'rgba(37, 99, 235, 0.14)' : 'rgba(16, 185, 129, 0.14)',
                  border: isChitkaraEmail ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid rgba(16, 185, 129, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>{isChitkaraEmail ? '🎓' : '🌐'}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isChitkaraEmail ? '#60a5fa' : '#34d399' }}>
                      {isChitkaraEmail ? 'Chitkara Student Pass Detected' : 'Campus Visitor Pass'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {isChitkaraEmail ? '⚡ 20 Queries / Day • Full Academic Access' : '⚡ 5 Queries / Day • Admissions & Campus FAQs'}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  Create Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '6px',
                  padding: '13px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                  fontFamily: 'inherit'
                }}
              >
                {loading ? 'Sending OTP to Email...' : 'Send Verification OTP ✉️'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={closeAuthModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ← Back to Overview / Close
                </button>
              </div>
            </form>
          )}

          {/* STEP: OTP VERIFICATION */}
          {activeTab === 'register' && step === 'otp' && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Enter the 6-digit code sent to:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#60a5fa', marginTop: '3px' }}>
                  {email}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#1e293b',
                    border: '2px solid #3b82f6',
                    borderRadius: '12px',
                    color: '#38bdf8',
                    fontSize: '26px',
                    fontWeight: 800,
                    letterSpacing: '8px',
                    textAlign: 'center',
                    outline: 'none',
                    boxShadow: '0 0 20px rgba(59,130,246,0.2)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  padding: '13px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  opacity: loading || otp.length !== 6 ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                  fontFamily: 'inherit'
                }}
              >
                {loading ? 'Verifying...' : 'Verify OTP & Enter Assistant 🚀'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                >
                  ← Change Email
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#64748b' : '#60a5fa',
                    fontSize: '12px',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 700
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* TAB: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  Registered Email
                </label>
                <input
                  type="email"
                  placeholder="your.email@chitkara.edu.in / gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '6px',
                  padding: '13px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                  fontFamily: 'inherit'
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In 🔑'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); resetState(); }}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Register with Email OTP
                  </button>
                </div>
                <button
                  type="button"
                  onClick={closeAuthModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ← Back to Overview / Close
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
