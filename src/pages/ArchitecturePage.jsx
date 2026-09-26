import React, { useState } from 'react';
import {
  Mic, Cpu, Database, Server, Speech, Zap, Route,
  Shield, Mail, FileText, Activity, CheckCircle, AlertTriangle, ArrowDown, UserCheck, Play, RefreshCw
} from 'lucide-react';

const ARCH_NODES = [
  { id: 'user', step: 1, title: '1. User Voice Input', desc: 'Captures voice queries in 10+ Indian Languages (Hindi, Punjabi, English, Hinglish)', icon: <Mic size={20} color="#60A5FA" /> },
  
  { id: 'stt_sarvam', step: 2, title: '2a. Sarvam AI (STT)', desc: 'Primary saaras:v3 model — ultra-fast Indian dialect speech-to-text', icon: <Speech size={18} color="#34D399" /> },
  { id: 'stt_azure', step: 2, title: '2b. Azure AI Speech (STT)', desc: 'Enterprise fallback speech recognition engine', icon: <Speech size={18} color="#F59E0B" /> },
  
  { id: 'auth_gateway', step: 3, title: '3. Identity Shield & Email OTP Gateway', desc: 'Real 6-Digit OTP via Gmail SMTP + JWT Bearer Auth + Daily Quota Limiter (20 Student / 5 Visitor)', icon: <Shield size={20} color="#38BDF8" /> },

  { id: 'router', step: 4, title: '4. LLM Intent & Tool Calling Router', desc: 'Azure OpenAI GPT-4.1-mini orchestrates RAG retrievals, ERP checks, and security guardrails', icon: <Route size={20} color="#A78BFA" /> },
  
  { id: 'rag', step: 5, title: '5a. Azure AI Search (RAG)', desc: 'Hybrid Vector + Semantic Search over Chitkara University Ordinances & indexed PDFs', icon: <Database size={18} color="#F472B6" /> },
  { id: 'guardrail', step: 5, title: '5b. Guardrail & Security Audit', desc: 'Filters out-of-scope queries & logs malicious attempts to Admin Audit panel', icon: <Zap size={18} color="#EF4444" /> },
  
  { id: 'tts_sarvam', step: 6, title: '6a. Sarvam AI (TTS)', desc: 'bulbul:v3 neural voice synthesis in user\'s native regional language', icon: <Server size={18} color="#34D399" /> },
  { id: 'tts_azure', step: 6, title: '6b. Azure Speech (TTS)', desc: 'High-fidelity neural TTS fallback voices', icon: <Server size={18} color="#60A5FA" /> },
  
  { id: 'output', step: 7, title: '7. Voice Output & ERP Feedback', desc: 'Delivers localized voice response + official rulebook citations to student', icon: <Mic size={20} color="#E2E8F0" /> },
];

const STEP_STATUSES = [
  '',
  '🎙️ Step 1: User speaks voice query in native Indian language (Hindi / Punjabi / English)...',
  '⚡ Step 2: Transcribing speech to text via Sarvam AI saaras:v3 & Azure Speech...',
  '✉️ Step 3: Verifying identity with Email OTP (Gmail SMTP), JWT token & daily quota pass...',
  '🤖 Step 4: Routing intent with Azure OpenAI GPT-4.1-mini (Ordinances vs ERP Tool vs Guardrail)...',
  '📚 Step 5: Performing Vector + Semantic RAG retrieval on Azure AI Search and checking security guardrails...',
  '🔊 Step 6: Generating high-fidelity neural voice audio via Sarvam bulbul:v3 & Azure Speech...',
  '🎓 Step 7: Completed! Multilingual voice response delivered with verified document citations!'
];

export const ArchitecturePage = () => {
  const [activeStep, setActiveStep] = useState(0); // 0 to 7
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedNode, setSelectedNode] = useState(ARCH_NODES[2]);

  const startFullSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActiveStep(1);
    
    let current = 1;
    const interval = setInterval(() => {
      current++;
      setActiveStep(current);
      if (current >= 7) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSimulating(false);
          setActiveStep(0);
        }, 4000);
      }
    }, 1100);
  };

  const getGlow = (stepIndex) => {
    if (isSimulating && activeStep === stepIndex) return 'rgba(56,189,248,0.45)';
    return 'transparent';
  };

  const getBorder = (stepIndex) => {
    if (isSimulating) {
      if (activeStep === stepIndex) return '#38BDF8';
      if (activeStep > stepIndex) return 'rgba(59,130,246,0.5)';
      return 'rgba(255,255,255,0.06)';
    }
    return 'rgba(255,255,255,0.08)';
  };

  const getOpacity = (stepIndex) => {
    if (!isSimulating) return 1;
    return activeStep >= stepIndex ? 1 : 0.3;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030509',
      padding: '3.5rem 1.5rem',
      fontFamily: "'Jost', 'Inter', sans-serif",
      color: '#F8FAFC'
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        
        {/* Top Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ 
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)',
            padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, color: '#60A5FA',
            letterSpacing: '0.06em', textTransform: 'uppercase'
          }}>⚡ System Blueprint · Enterprise Azure Architecture</span>
        </div>

        <h1 style={{
          fontSize: '2.75rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.02em',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #94A3B8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Full End-to-End System Architecture
        </h1>

        <p style={{ color: '#8B9CC8', fontSize: '1.05rem', maxWidth: 700, margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Zero-latency multilingual voice orchestration with <strong>Azure AI Search RAG</strong>, <strong>Azure OpenAI</strong>, <strong>Sarvam AI</strong>, and <strong>Enterprise Email OTP Security</strong>.
        </p>

        {/* ── Single Master Simulation Button ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '3.5rem' }}>
          <button 
            onClick={startFullSimulation}
            disabled={isSimulating}
            style={{
              background: isSimulating ? 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)' : 'linear-gradient(135deg, #0078D4 0%, #8B5CF6 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              padding: '14px 28px', borderRadius: 14, cursor: isSimulating ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: isSimulating ? '0 0 35px rgba(37,99,235,0.6)' : '0 4px 25px rgba(0,120,212,0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            {isSimulating ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} fill="#FFFFFF" />}
            <span>{isSimulating ? 'Simulating Complete End-to-End Flow...' : '▶ Simulate Complete System Flow (All Steps)'}</span>
          </button>

          {/* Dynamic Live Step Banner */}
          {isSimulating && (
            <div style={{
              background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(56,189,248,0.4)',
              padding: '10px 20px', borderRadius: 12, color: '#38BDF8', fontSize: '0.9rem',
              fontWeight: 600, animation: 'fadeIn 0.3s ease-out', maxWidth: 720,
              boxShadow: '0 0 25px rgba(56,189,248,0.25)'
            }}>
              {STEP_STATUSES[activeStep]}
            </div>
          )}
        </div>

        {/* ── Interactive Architecture Pipeline ── */}
        <div style={{
          position: 'relative',
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          alignItems: 'center'
        }}>
          
          {/* Connector Spine */}
          <div style={{
            position: 'absolute', top: 40, bottom: 40, left: '50%', width: 2,
            background: 'linear-gradient(180deg, #1E293B 0%, #3B82F6 50%, #1E293B 100%)',
            zIndex: 0, transform: 'translateX(-50%)', opacity: 0.5
          }} />

          {/* Level 1: Input */}
          <div
            onClick={() => setSelectedNode(ARCH_NODES[0])}
            style={{
              zIndex: 10, width: 340, maxWidth: '90vw', background: '#0B0F19', padding: '1rem 1.25rem',
              borderRadius: 16, border: `1px solid ${getBorder(1)}`, boxShadow: `0 0 30px ${getGlow(1)}`,
              opacity: getOpacity(1), transition: 'all 0.4s ease', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(59,130,246,0.15)', padding: 10, borderRadius: 12 }}>
                {ARCH_NODES[0].icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F1F5F9' }}>{ARCH_NODES[0].title}</div>
                <div style={{ color: '#8B9CC8', fontSize: '0.78rem' }}>{ARCH_NODES[0].desc}</div>
              </div>
            </div>
          </div>

          {/* Level 2: STT Layer */}
          <div style={{ display: 'flex', gap: '1.5rem', zIndex: 10, position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div
              onClick={() => setSelectedNode(ARCH_NODES[1])}
              style={{
                width: 260, background: '#0B0F19', padding: '1rem 1.25rem', borderRadius: 16,
                border: `1px solid ${getBorder(2)}`, boxShadow: `0 0 25px ${getGlow(2)}`,
                opacity: getOpacity(2), transition: 'all 0.4s ease', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: 'rgba(52,211,153,0.15)', padding: 8, borderRadius: 10 }}>
                  {ARCH_NODES[1].icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ARCH_NODES[1].title}</div>
                  <div style={{ color: '#8B9CC8', fontSize: '0.72rem' }}>{ARCH_NODES[1].desc}</div>
                </div>
              </div>
            </div>

            <div
              onClick={() => setSelectedNode(ARCH_NODES[2])}
              style={{
                width: 260, background: '#0B0F19', padding: '1rem 1.25rem', borderRadius: 16,
                border: `1px solid ${getBorder(2)}`, opacity: getOpacity(2) * 0.8,
                transition: 'all 0.4s ease', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: 'rgba(245,158,11,0.15)', padding: 8, borderRadius: 10 }}>
                  {ARCH_NODES[2].icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ARCH_NODES[2].title}</div>
                  <div style={{ color: '#8B9CC8', fontSize: '0.72rem' }}>{ARCH_NODES[2].desc}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Level 3: Identity & Security Shield (Email OTP + Quota) */}
          <div
            onClick={() => setSelectedNode(ARCH_NODES[3])}
            style={{
              zIndex: 10, width: 420, maxWidth: '90vw', background: 'linear-gradient(135deg, #0d1633 0%, #0b0f19 100%)',
              padding: '1.1rem 1.35rem', borderRadius: 16, border: `1px solid ${getBorder(3)}`,
              boxShadow: `0 0 35px ${getGlow(3)}`, opacity: getOpacity(3), transition: 'all 0.4s ease', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(56,189,248,0.18)', padding: 10, borderRadius: 12 }}>
                {ARCH_NODES[3].icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38BDF8' }}>{ARCH_NODES[3].title}</div>
                <div style={{ color: '#CBD5E1', fontSize: '0.75rem', marginTop: 2 }}>{ARCH_NODES[3].desc}</div>
              </div>
            </div>
          </div>

          {/* Level 4: LLM Router */}
          <div
            onClick={() => setSelectedNode(ARCH_NODES[4])}
            style={{
              zIndex: 10, width: 360, maxWidth: '90vw', background: '#0B0F19', padding: '1.1rem 1.35rem',
              borderRadius: 16, border: `1px solid ${getBorder(4)}`, boxShadow: `0 0 35px ${getGlow(4)}`,
              opacity: getOpacity(4), transition: 'all 0.4s ease', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(167,139,250,0.18)', padding: 10, borderRadius: 12 }}>
                {ARCH_NODES[4].icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#E8EEFF' }}>{ARCH_NODES[4].title}</div>
                <div style={{ color: '#8B9CC8', fontSize: '0.75rem' }}>{ARCH_NODES[4].desc}</div>
              </div>
            </div>
          </div>

          {/* Level 5: RAG vs Guardrail Split */}
          <div style={{ display: 'flex', gap: '1.5rem', zIndex: 10, position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div
              onClick={() => setSelectedNode(ARCH_NODES[5])}
              style={{
                width: 270, background: '#0B0F19', padding: '1.1rem 1.25rem', borderRadius: 16,
                border: `1px solid ${getBorder(5)}`, boxShadow: `0 0 30px ${getGlow(5)}`,
                opacity: getOpacity(5), transition: 'all 0.4s ease', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: 'rgba(244,114,182,0.15)', padding: 9, borderRadius: 10 }}>
                  {ARCH_NODES[5].icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F1F5F9' }}>{ARCH_NODES[5].title}</div>
                  <div style={{ color: '#8B9CC8', fontSize: '0.72rem' }}>{ARCH_NODES[5].desc}</div>
                </div>
              </div>
            </div>

            <div
              onClick={() => setSelectedNode(ARCH_NODES[6])}
              style={{
                width: 270, background: '#0B0F19', padding: '1.1rem 1.25rem', borderRadius: 16,
                border: `1px solid ${getBorder(5)}`, boxShadow: `0 0 30px ${getGlow(5)}`,
                opacity: getOpacity(5), transition: 'all 0.4s ease', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: 'rgba(239,68,68,0.15)', padding: 9, borderRadius: 10 }}>
                  {ARCH_NODES[6].icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F87171' }}>{ARCH_NODES[6].title}</div>
                  <div style={{ color: '#8B9CC8', fontSize: '0.72rem' }}>{ARCH_NODES[6].desc}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Level 6: Dual TTS Layer */}
          <div
            onClick={() => setSelectedNode(ARCH_NODES[7])}
            style={{
              display: 'flex', gap: '1.5rem', zIndex: 10, background: '#0B0F19', padding: '1.1rem 1.5rem',
              borderRadius: 16, border: `1px solid ${getBorder(6)}`, boxShadow: `0 0 30px ${getGlow(6)}`,
              opacity: getOpacity(6), transition: 'all 0.4s ease', cursor: 'pointer', flexWrap: 'wrap', justifyContent: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(52,211,153,0.15)', padding: 7, borderRadius: 8 }}>
                {ARCH_NODES[7].icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ARCH_NODES[7].title}</div>
                <div style={{ color: '#8B9CC8', fontSize: '0.7rem' }}>{ARCH_NODES[7].desc}</div>
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(96,165,250,0.15)', padding: 7, borderRadius: 8 }}>
                {ARCH_NODES[8].icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ARCH_NODES[8].title}</div>
                <div style={{ color: '#8B9CC8', fontSize: '0.7rem' }}>{ARCH_NODES[8].desc}</div>
              </div>
            </div>
          </div>

          {/* Level 7: Final Voice Output */}
          <div
            onClick={() => setSelectedNode(ARCH_NODES[9])}
            style={{
              zIndex: 10, width: 340, maxWidth: '90vw', background: '#0B0F19', padding: '1.1rem 1.25rem',
              borderRadius: 16, border: `1px solid ${getBorder(7)}`, boxShadow: `0 0 40px ${getGlow(7)}`,
              opacity: getOpacity(7), transition: 'all 0.4s ease', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 12 }}>
                {ARCH_NODES[9].icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F1F5F9' }}>{ARCH_NODES[9].title}</div>
                <div style={{ color: '#8B9CC8', fontSize: '0.75rem' }}>{ARCH_NODES[9].desc}</div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Subsystem Details Drawer ── */}
        {selectedNode && (
          <div style={{
            marginTop: '3.5rem', background: '#0B0F22', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 20, padding: '2rem', textAlign: 'left',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>⚙️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#F8FAFC', fontWeight: 800 }}>{selectedNode.title}</h3>
                  <span style={{ color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600 }}>Active Subsystem Architecture</span>
                </div>
              </div>
              <span style={{ background: 'rgba(59,130,246,0.15)', color: '#93C5FD', padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                Enterprise Grade
              </span>
            </div>

            <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {selectedNode.desc}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#8B9CC8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Protocol & Gateway</div>
                <div style={{ color: '#F1F5F9', fontSize: '0.9rem', fontWeight: 600, marginTop: 4 }}>FastAPI + Async HTTPX + JWT + SMTP</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#8B9CC8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Target Latency</div>
                <div style={{ color: '#34D399', fontSize: '0.9rem', fontWeight: 600, marginTop: 4 }}>&lt; 950ms Voice-to-Voice</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#8B9CC8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Cloud Providers</div>
                <div style={{ color: '#60A5FA', fontSize: '0.9rem', fontWeight: 600, marginTop: 4 }}>Microsoft Azure & Sarvam AI</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ArchitecturePage;
