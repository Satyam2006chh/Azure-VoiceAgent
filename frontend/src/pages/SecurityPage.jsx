import React from 'react';
import { RbacSimulator } from '../components/security/RbacSimulator';
import { ShieldCheck, Lock, KeyRound } from 'lucide-react';

export const SecurityPage = () => {
  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
          <span className="badge badge-azure">
            <ShieldCheck size={12} />
            Security & Identity
          </span>
          <span className="badge badge-success">Microsoft Entra ID</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
          Security & Access Control
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Zero-Trust OAuth2 verification and role-based permissions for student records.
        </p>
      </div>

      {/* Security Highlights Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ padding: '1.25rem', borderTop: '3px solid #0078D4', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
            <KeyRound size={16} color="#0078D4" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>OAuth2 Token Verification</h3>
          </div>
          <p style={{ fontSize: '0.78125rem', color: '#64748B', lineHeight: 1.45 }}>
            Every request validates RSA-signed JWT claims against Entra ID public keys.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderTop: '3px solid #059669', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
            <Lock size={16} color="#059669" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Field-Level RAG Security</h3>
          </div>
          <p style={{ fontSize: '0.78125rem', color: '#64748B', lineHeight: 1.45 }}>
            Index filters restrict confidential student ledgers and marks from guest users.
          </p>
        </div>
      </div>

      {/* Simulator */}
      <RbacSimulator />
    </div>
  );
};
