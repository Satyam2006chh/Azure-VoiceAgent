import React from 'react';
import { useApp } from '../context/AppContext';
import { Bot, Mic, Search, ArrowRight, Globe, Layers, Volume2, Zap, Shield, FileText, Clock } from 'lucide-react';

const KNOWLEDGE_DOCS = [
  {
    icon: '📋',
    title: 'Academic Regulations',
    desc: 'Attendance rules (75%), grading scale, promotion criteria, exam eligibility.',
    tags: ['Attendance', 'Grading', 'Exams'],
    status: 'active',
  },
  {
    icon: '💰',
    title: 'Fee Schedules & Deadlines',
    desc: 'Tuition fees, hostel charges, late fee penalties, and payment portal links.',
    tags: ['Fees', 'Deadlines', 'Penalties'],
    status: 'active',
  },
  {
    icon: '🏠',
    title: 'Hostel & Campus Rules',
    desc: 'Hostel allotment, curfew timings, visitor policy, disciplinary regulations.',
    tags: ['Hostel', 'Curfew', 'Campus'],
    status: 'active',
  },
  {
    icon: '🔀',
    title: 'Branch Change Ordinance',
    desc: 'CGPA cutoffs, eligibility criteria, and backlog restrictions for branch transfer.',
    tags: ['Branch Change', 'CGPA', 'Transfer'],
    status: 'active',
  },
  {
    icon: '📚',
    title: 'Central Library Catalog',
    desc: 'Book availability, shelf locations, borrowing limits, and reading room timings.',
    tags: ['Library', 'Books', 'OPAC'],
    status: 'active',
  },
  {
    icon: '👨‍🏫',
    title: 'Faculty Directory',
    desc: 'Cabin locations, office hours, email IDs, and department-wise listing.',
    tags: ['Faculty', 'Contacts', 'Cabins'],
    status: 'active',
  },
  {
    icon: '📝',
    title: 'Examination Notices',
    desc: 'End-semester schedules, seating arrangements, unfair means policy.',
    tags: ['Exams', 'Schedule', 'Policy'],
    status: 'coming-soon',
  },
  {
    icon: '🎓',
    title: 'Placement & Internship Records',
    desc: 'Company-wise placement stats, internship guidelines, CDC portal access.',
    tags: ['Placement', 'Internship', 'CDC'],
    status: 'coming-soon',
  },
];

const PILLARS = [
  {
    icon: <Mic size={22} />,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    title: 'Indic Voice AI',
    desc: '10+ Indian languages supported. Speak in Hindi, Tamil, Telugu, or any regional language and get instant answers.',
  },
  {
    icon: <Search size={22} />,
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.1)',
    title: 'Grounded RAG',
    desc: 'Azure AI Search retrieves from official university ordinances — zero hallucinations, every answer is cited.',
  },
  {
    icon: <Volume2 size={22} />,
    color: '#34D399',
    bg: 'rgba(52,211,153,0.1)',
    title: 'Voice Response',
    desc: 'Sarvam AI TTS (bulbul:v3) speaks the answer back in the user\'s own language — full voice-to-voice loop.',
  },
];

const STATS = [
  { value: '10+',    label: 'Indian Languages',  color: '#60A5FA' },
  { value: '100%',   label: 'Grounded Ordinances', color: '#34D399' },
  { value: '<950ms', label: 'Voice Latency',      color: '#FBBF24' },
  { value: '6',      label: 'Core Cloud Services', color: '#A78BFA' },
];

export const AboutPage = () => {
  const { navigateTo, triggerVoiceQuerySimulation, selectedLanguage } = useApp();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '5rem', padding: '3rem 0 6rem' }}>

      {/* ─────────────── HERO ─────────────── */}
      <section style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '0 1.5rem' }}>
        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <span className="badge badge-azure"><Globe size={11} />10+ Indian Languages</span>
          <span className="badge badge-success"><Zap size={11} />Live Azure AI</span>
          <span className="badge"><Shield size={11} />RAG Grounded</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          marginBottom: '1.25rem',
          color: '#F1F5F9',
        }}>
          Multilingual Voice AI<br />
          <span style={{
            background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            for University Academics
          </span>
        </h1>

        <p style={{ fontSize: '1.0625rem', color: '#94A3B8', maxWidth: 540, margin: '0 auto 2.5rem', lineHeight: 1.65 }}>
          Ask anything about fees, exams, attendance, or library — in your language —
          and get instant spoken answers grounded in official university ordinances.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: '2.5rem' }}>
          <button className="btn btn-primary btn-lg animate-glow" onClick={() => navigateTo('assistant')}>
            <Bot size={17} />
            <span>Launch Voice Assistant</span>
            <ArrowRight size={15} />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigateTo('architecture')}>
            <Layers size={17} style={{ color: '#60A5FA' }} />
            <span>View Architecture</span>
          </button>
        </div>

        {/* Live demo strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, maxWidth: 520, margin: '0 auto',
          background: '#141928', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', minWidth: 0 }}>
            <div className="animate-float" style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Mic size={16} color="#60A5FA" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sample — {selectedLanguage.name}
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
                "{selectedLanguage.samplePrompt}"
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => {
            navigateTo('assistant');
          }}>
            Try Now
          </button>
        </div>
      </section>

      {/* ─────────────── STATS BAR ─────────────── */}
      <section className="container">
        <div style={{
          background: '#141928', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '1.5rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem', textAlign: 'center',
        }}>
          {STATS.map(({ value, label, color }) => (
            <div key={label}>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── 3 PILLARS ─────────────── */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            How It Works
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em' }}>
            Three Core Capabilities
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {PILLARS.map(({ icon, color, bg, title, desc }) => (
            <div key={title} className="card" style={{ padding: '1.5rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: bg, border: `1px solid ${color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, marginBottom: '1rem',
              }}>
                {icon}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: 6 }}>{title}</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── KNOWLEDGE DOCS SECTION ─────────────── */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Knowledge Base
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em' }}>
            Documents Powering the AI
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: 8 }}>
            Official university ordinances indexed into Azure AI Search for grounded, cited answers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {KNOWLEDGE_DOCS.map((doc) => (
            <div key={doc.title} className="card" style={{
              padding: '1.25rem',
              opacity: doc.status === 'coming-soon' ? 0.65 : 1,
              position: 'relative', overflow: 'hidden',
            }}>
              {doc.status === 'coming-soon' && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: 20, padding: '2px 8px',
                  fontSize: 10, fontWeight: 700, color: '#FBBF24',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Clock size={9} /> Coming Soon
                </div>
              )}
              {doc.status === 'active' && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: 20, padding: '2px 8px',
                  fontSize: 10, fontWeight: 700, color: '#34D399',
                }}>
                  ● Active
                </div>
              )}
              <div style={{ fontSize: 24, marginBottom: 8 }}>{doc.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9', marginBottom: 5 }}>{doc.title}</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55, marginBottom: 10 }}>{doc.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {doc.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, fontWeight: 600, color: '#475569',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, padding: '2px 8px',
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
