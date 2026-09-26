import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  AlertTriangle,
  MicOff,
  Database,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export const ErrorFallbackSimulator = () => {
  const { fallbackMode, setFallbackMode } = useApp();

  const fallbackOptions = [
    {
      id: 'none',
      label: 'Normal Flow (100% Grounded)',
      desc: 'Optimal Azure AI Speech, RAG, and reasoning pipeline.',
      icon: <CheckCircle2 size={16} color="#059669" />,
    },
    {
      id: 'stt_low_snr',
      label: 'Low SNR / Acoustic Noise',
      desc: 'Simulates Azure AI Speech confidence < 0.60 dropping to text fallback.',
      icon: <MicOff size={16} color="#DC2626" />,
    },
    {
      id: 'rag_out_of_bounds',
      label: 'Out of Syllabus / Unverified',
      desc: 'Simulates RAG threshold failure preventing hallucinated answers.',
      icon: <Database size={16} color="#D97706" />,
    },
    {
      id: 'entra_unauthorized',
      label: 'Guest Access / RBAC Blocked',
      desc: 'Simulates Entra ID rejecting private student grades for guest role.',
      icon: <Lock size={16} color="#7C3AED" />,
    },
  ];

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        borderRadius: '14px',
        marginBottom: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
        <ShieldAlert size={18} color="#0078D4" />
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Reliability & Fallback Simulator
        </h3>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Test how the system gracefully handles noisy audio, ungrounded inquiries, or unauthorized RBAC requests:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {fallbackOptions.map((opt) => {
          const isSelected = fallbackMode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setFallbackMode(opt.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: isSelected ? '1px solid var(--border-blue)' : '1px solid var(--border)',
                backgroundColor: isSelected ? 'rgba(37,99,235,0.15)' : 'var(--bg-muted)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {opt.icon}
                <span style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 600, color: 'var(--text-primary)' }}>
                  {opt.label}
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
