import React, { useState, useRef, useEffect } from 'react';

// ─────────────────────────────────────────────
// Flow nodes definition
// ─────────────────────────────────────────────
const STEPS = [
  {
    id: 'user',
    icon: '🎤',
    title: 'User',
    desc: 'Speaks in selected language\n(Hindi / Tamil / Telugu / ...)',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    id: 'stt',
    icon: '🎧',
    title: 'Sarvam STT  (saaras:v3)',
    desc: 'Converts speech → text in same language',
    fallback: 'Azure Speech STT if Sarvam fails',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    id: 'translate',
    icon: '🔤',
    title: 'Query → English (internal)',
    desc: 'GPT-4.1-mini translates query to English\nso Azure AI Search can retrieve accurately',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    id: 'router',
    icon: '🧭',
    title: 'Intent Router (GPT-4.1-mini)',
    desc: 'Classifies: IN-SCOPE or OUT-OF-SCOPE\nPicks the right tool to call',
    fallback: 'Out-of-scope → polite redirect in user language',
    color: '#0891B2',
    bg: '#ECFEFF',
  },
  {
    id: 'tools',
    icon: '🔧',
    title: 'Tool / RAG Execution',
    desc: 'Fees · Library · Faculty · Ranking · Ordinances\nAzure AI Search retrieves English docs',
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    id: 'llm',
    icon: '✨',
    title: 'GPT-4.1-mini Response',
    desc: 'Generates answer grounded in retrieved docs\nResponds in user\'s selected language',
    fallback: 'Hardcoded template if OpenAI offline',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    id: 'tts',
    icon: '🔊',
    title: 'Sarvam TTS  (bulbul:v3)',
    desc: 'Speaks answer in user\'s language\n(same language as their question)',
    fallback: 'Azure Neural TTS if Sarvam fails',
    color: '#DB2777',
    bg: '#FDF2F8',
  },
  {
    id: 'output',
    icon: '💬',
    title: 'Screen + Voice Output',
    desc: 'Text shown in user\'s script (Tamil/Hindi/...)\nAudio played in same language',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
];

const SUPPORTED_LANGS = [
  'हिन्दी', 'English', 'தமிழ்', 'తెలుగు',
  'मराठी', 'বাংলা', 'ગુજરાતી', 'ಕನ್ನಡ', 'മലയാളം', 'ਪੰਜਾਬੀ',
];

export const ArchitectureDiagram = () => {
  const [activeIdx, setActiveIdx] = useState(null);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (playing) {
      let i = 0;
      setActiveIdx(0);
      timerRef.current = setInterval(() => {
        i += 1;
        if (i >= STEPS.length) {
          clearInterval(timerRef.current);
          setPlaying(false);
          setActiveIdx(null);
        } else {
          setActiveIdx(i);
        }
      }, 1200);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing]);

  const handlePlay = () => {
    setActiveIdx(null);
    setPlaying(false);
    setTimeout(() => setPlaying(true), 50);
  };

  return (
    <div style={{
      background: '#FAFAFA',
      border: '1px solid #E2E8F0',
      borderRadius: 16,
      padding: '24px 28px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
            End-to-End Flow
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Click any step · <span style={{ color: '#D97706' }}>Orange = fallback path</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handlePlay}
            style={{
              background: playing ? '#DC2626' : '#2563EB',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {playing ? '■ Stop' : '▶ Simulate'}
          </button>
          <button
            onClick={() => { setPlaying(false); setActiveIdx(null); }}
            style={{
              background: 'transparent', border: '1px solid #CBD5E1',
              borderRadius: 8, padding: '7px 14px', fontSize: 12,
              color: '#64748B', cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {STEPS.map((step, idx) => {
          const isActive = activeIdx === idx;
          return (
            <React.Fragment key={step.id}>
              {/* Node */}
              <div
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                style={{
                  width: '100%',
                  maxWidth: 560,
                  background: isActive ? step.bg : '#FFFFFF',
                  border: `1.5px solid ${isActive ? step.color : '#E2E8F0'}`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? `0 0 0 3px ${step.color}22, 0 4px 16px ${step.color}18`
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  background: isActive ? step.color : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, transition: 'all 0.25s ease',
                }}>
                  {step.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13.5,
                    color: isActive ? step.color : '#1E293B',
                    marginBottom: 3,
                  }}>
                    {step.title}
                  </div>
                  <div style={{
                    fontSize: 11.5, color: '#64748B', lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                  }}>
                    {step.desc}
                  </div>
                  {step.fallback && (
                    <div style={{
                      marginTop: 6, fontSize: 11,
                      color: '#D97706', background: '#FFFBEB',
                      border: '1px dashed #FCD34D',
                      borderRadius: 6, padding: '3px 8px',
                      display: 'inline-block',
                    }}>
                      ⚠ Fallback: {step.fallback}
                    </div>
                  )}
                </div>

                {/* Step number */}
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: isActive ? step.color : '#CBD5E1',
                  flexShrink: 0, alignSelf: 'center',
                  minWidth: 24, textAlign: 'right',
                }}>
                  {idx + 1}/{STEPS.length}
                </div>
              </div>

              {/* Arrow between steps */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  margin: '3px 0',
                }}>
                  <div style={{
                    width: 1.5, height: 12,
                    background: activeIdx !== null && idx < activeIdx ? '#2563EB' : '#CBD5E1',
                    transition: 'background 0.3s',
                  }} />
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `6px solid ${activeIdx !== null && idx < activeIdx ? '#2563EB' : '#CBD5E1'}`,
                    transition: 'border-color 0.3s',
                  }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Language bar */}
      <div style={{
        marginTop: 20, padding: '12px 16px',
        background: '#F8FAFC', borderRadius: 10,
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Supported Languages (Sarvam AI)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SUPPORTED_LANGS.map(lang => (
            <span key={lang} style={{
              fontSize: 12, color: '#475569', background: '#FFFFFF',
              border: '1px solid #E2E8F0', borderRadius: 20,
              padding: '3px 11px', fontWeight: 500,
            }}>
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Key insight */}
      <div style={{
        marginTop: 12, padding: '10px 14px',
        background: '#FFFBEB', border: '1px solid #FCD34D',
        borderRadius: 8, fontSize: 12, color: '#92400E', lineHeight: 1.5,
      }}>
        <strong>🔑 How it works:</strong> User speaks in Tamil → Sarvam STT transcribes in Tamil → query translated to English internally (for accurate RAG search) → GPT-4.1-mini replies in Tamil → Sarvam TTS speaks in Tamil → screen also shows Tamil text.
      </div>
    </div>
  );
};
