import React from 'react';
import { useApp } from '../../context/AppContext';

export const Footer = () => {
  const { navigateTo } = useApp();

  const navLinks = [
    { label: 'Overview',     route: 'about' },
    { label: 'Voice AI',     route: 'assistant' },
    { label: 'Architecture', route: 'architecture' },
    { label: 'Azure Stack',  route: 'technology' },
    { label: 'Team',         route: 'team' },
  ];

  const techStack = [
    'Sarvam AI  (STT / TTS)',
    'Azure OpenAI GPT-4.1-mini',
    'Azure AI Search (RAG)',
    'FastAPI Backend',
    'React + Vite Frontend',
  ];

  return (
    <footer style={{
      background: '#080C18',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '3rem 0 1.5rem',
      marginTop: 'auto',
      fontFamily: 'var(--font-sans)',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="3.5" fill="white" opacity="0.9"/>
                  <path d="M9 2 L9 6 M9 12 L9 16 M2 9 L6 9 M12 9 L16 9" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
                  <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.2" opacity="0.3"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#F1F5F9', letterSpacing: '-0.03em' }}>UniVoice</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.65, marginBottom: '1rem', maxWidth: 220 }}>
              Multilingual Voice AI assistant for university academic rules and student queries.
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 6, padding: '4px 10px',
              fontSize: '0.7rem', color: '#60A5FA', fontWeight: 600,
            }}>
              ☁ Powered by Microsoft Azure AI
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.9rem' }}>
              Navigation
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navLinks.map(({ label, route }) => (
                <li key={route}>
                  <button
                    onClick={() => navigateTo(route)}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      fontSize: '0.8125rem', color: '#64748B', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', fontWeight: 500,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.color = '#94A3B8'}
                    onMouseLeave={e => e.target.style.color = '#64748B'}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.9rem' }}>
              Tech Stack
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {techStack.map(tech => (
                <li key={tech} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{tech}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Capstone */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.9rem' }}>
              Capstone
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Chitkara University
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
              Dept. of Computer Science &amp; Engineering<br />
              Academic Year 2025–2026
            </div>
            <button
              onClick={() => navigateTo('team')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              View Team →
            </button>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          paddingTop: '1.25rem',
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center',
          gap: '0.75rem', fontSize: '0.75rem', color: '#374151',
        }}>
          <span>© 2025–2026 Chitkara University Capstone Team. Built on Microsoft Azure Cloud AI.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Grounded RAG · Zero Hallucinations</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
