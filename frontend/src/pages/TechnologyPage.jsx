import React, { useState } from 'react';
import { AZURE_SERVICES_DATA } from '../data/azureServicesData';
import { Cpu, CheckCircle2, Code2, ShieldCheck, Bot, Search, Mic, Volume2, Activity } from 'lucide-react';

const ICON_MAP = {
  Bot: <Bot size={18} color="#F59E0B" />,
  Search: <Search size={18} color="#EC4899" />,
  Mic: <Mic size={18} color="#34D399" />,
  Volume2: <Volume2 size={18} color="#60A5FA" />,
  ShieldCheck: <ShieldCheck size={18} color="#38BDF8" />,
  Activity: <Activity size={18} color="#A78BFA" />,
};

export const TechnologyPage = () => {
  const [selectedServiceId, setSelectedServiceId] = useState(AZURE_SERVICES_DATA[0].id);
  const selectedService = AZURE_SERVICES_DATA.find((s) => s.id === selectedServiceId) || AZURE_SERVICES_DATA[0];

  return (
    <div className="container animate-fade-in" style={{ padding: '3rem 1.5rem 5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span className="badge badge-azure"><Cpu size={11} />Cloud Architecture</span>
          <span className="badge badge-success">6 Core Services</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 8 }}>
          Enterprise Cloud & AI Technology Stack
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto' }}>
          State-of-the-art Azure AI, Sarvam AI, and Security services powering voice, search, reasoning, and authentication.
        </p>
      </div>

      {/* Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'flex-start' }}>

        {/* Left: Service List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {AZURE_SERVICES_DATA.map((srv) => {
            const isSelected = selectedService.id === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => setSelectedServiceId(srv.id)}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 10,
                  padding: '0.9rem 1rem', borderRadius: 12,
                  border: isSelected ? '1.5px solid var(--border-blue)' : '1px solid var(--border)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(59,130,246,0.08))'
                    : 'var(--bg-card)',
                  textAlign: 'left', cursor: 'pointer',
                  transition: 'all 0.18s ease', fontFamily: 'var(--font-sans)',
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flexShrink: 0 }}>
                    {ICON_MAP[srv.iconName] || <Cpu size={18} color="#60A5FA" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--blue-300)' : 'var(--text-primary)' }}>
                      {srv.name}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {srv.tagline}
                    </div>
                  </div>
                </div>
                <span className="badge" style={{ fontSize: '0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {srv.slaMetrics.avgLatency}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Detail Panel */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedService.name}
              </h2>
              <span className="badge badge-azure">{selectedService.category}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {selectedService.roleInProject}
            </p>
          </div>

          {/* Key Specs */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
            padding: '0.85rem', backgroundColor: 'var(--bg-muted)',
            borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SLA</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success-text)', marginTop: 2 }}>
                {selectedService.slaMetrics.availability}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>LATENCY</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--blue-400)', marginTop: 2 }}>
                {selectedService.slaMetrics.avgLatency}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SCALE</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                {selectedService.slaMetrics.throughput}
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Highlights
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {selectedService.keyFeatures.map((feat, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={13} color="var(--blue-500)" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code snippet */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              <Code2 size={11} color="var(--blue-400)" />
              Integration SDK
            </div>
            <pre style={{
              background: 'var(--bg-body)', color: 'var(--blue-300)',
              padding: '0.85rem', borderRadius: 8,
              fontSize: '0.715rem', fontFamily: 'var(--font-mono)',
              overflowX: 'auto', lineHeight: 1.5,
              border: '1px solid var(--border)',
            }}>
              <code>{selectedService.sampleCode}</code>
            </pre>
          </div>

          {/* Compliance footer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.725rem', color: 'var(--text-muted)',
            borderTop: '1px solid var(--border)', paddingTop: '0.6rem',
          }}>
            <ShieldCheck size={13} color="var(--success-text)" />
            <span>{selectedService.securityCompliance}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
