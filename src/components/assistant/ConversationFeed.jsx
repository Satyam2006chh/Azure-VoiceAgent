import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  Bot,
  User,
  Volume2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  ArrowRight,
  Download,
  ShieldAlert,
} from 'lucide-react';

export const ConversationFeed = () => {
  const { messages, setActiveCitation, isPlayingAudio, setIsPlayingAudio } = useApp();
  const [expandedTraces, setExpandedTraces] = useState({});
  const [executedActions, setExecutedActions] = useState({});

  const toggleTrace = (id) => {
    setExpandedTraces((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleActionClick = (actionId) => {
    setExecutedActions((prev) => ({ ...prev, [actionId]: true }));
  };

  // IDs of the initial mock messages
  const MOCK_IDS = new Set(['msg-1-init-ast', 'msg-2-user', 'msg-3-ast']);
  const hasRealMessages = messages.some(m => !MOCK_IDS.has(m.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
      {/* Demo preview banner — shown only while still on mock messages */}
      {!hasRealMessages && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FBBF24' }}>Example Preview</span>
            <span style={{ fontSize: '0.78rem', color: '#8B9CC8', marginLeft: 8 }}>
              This is a demo conversation. Tap the mic or type a question to start a real session.
            </span>
          </div>
          <span style={{
            marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
            color: '#FBBF24', background: 'rgba(251,191,36,0.15)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
          }}>DEMO</span>
        </div>
      )}
      {messages.map((msg) => {
        const isAssistant = msg.sender === 'assistant';
        const isTraceOpen = !!expandedTraces[msg.id];

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              padding: '1.25rem',
              borderRadius: '12px',
              backgroundColor: isAssistant ? 'var(--bg-card)' : 'var(--bg-card-2)',
              border: isAssistant ? '1px solid var(--border-bright)' : '1px solid var(--border)',
              boxShadow: isAssistant ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {/* Sender Avatar */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isAssistant ? 'var(--blue-600)' : 'var(--bg-muted)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isAssistant ? <Bot size={20} /> : <User size={20} />}
            </div>

            {/* Message Body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header: Name, Timestamp, Telemetry */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {isAssistant ? 'UnivAI Assistant (Microsoft Azure)' : 'Student Voice Query'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {msg.transcriptionConfidence && (
                    <Badge variant="success">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        STT Acc: {(msg.transcriptionConfidence * 100).toFixed(1)}%
                      </span>
                    </Badge>
                  )}
                  {msg.audioDurationSeconds && (
                    <Badge variant="default">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Volume2 size={12} />
                        {msg.audioDurationSeconds}s Audio
                      </span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Error Fallback Banner */}
              {msg.isErrorFallback && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#991B1B' }}>
                      Reliability Guardrail Triggered
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>
                      {msg.errorReason || 'Deterministic fallback executed to prevent unverified response.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: msg.isErrorFallback ? 'var(--error-text)' : 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  marginBottom: isAssistant && (msg.citations || msg.actions || msg.trace) ? '1rem' : '0',
                }}
              >
                {msg.text}
              </div>

              {/* Grounded RAG Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Layers size={13} color="#0078D4" />
                    <span>Verified Citations ({msg.citations.length})</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {msg.citations.map((cite) => (
                      <button
                        key={cite.id}
                        onClick={() => setActiveCitation(cite)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          backgroundColor: '#EFF6FF',
                          borderColor: '#BFDBFE',
                          color: '#0078D4',
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                        title="Click to view verified source chunk"
                      >
                        <FileText size={13} />
                        <span style={{ fontWeight: 600, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cite.docTitle}
                        </span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          p.{cite.pageNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Tool Actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {msg.actions.map((act) => {
                      const isDone = !!executedActions[act.id];
                      return (
                        <button
                          key={act.id}
                          onClick={() => handleActionClick(act.id)}
                          className="btn btn-primary btn-sm"
                          style={{
                            backgroundColor: isDone ? '#059669' : '#0078D4',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {act.type === 'download' ? <Download size={13} /> : <ArrowRight size={13} />}
                          <span>{isDone ? 'Action Executed ✓' : act.buttonText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cloud Execution Trace (Collapsible) */}
              {msg.trace && msg.trace.length > 0 && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
                  <button
                    onClick={() => toggleTrace(msg.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <Activity size={12} color="#0078D4" />
                    <span>{isTraceOpen ? 'Hide Azure Cloud Trace' : 'View Azure Pipeline Trace'}</span>
                    {isTraceOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {isTraceOpen && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-body)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '0.5rem' }}>
                        Azure Cloud Execution Pipeline:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {msg.trace.map((step) => (
                          <div
                            key={step.step}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              borderBottom: '1px solid #1E293B',
                              paddingBottom: '4px',
                            }}
                          >
                            <div>
                              <span style={{ color: '#FCD34D' }}>[{step.layer}]</span>{' '}
                              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{step.azureService}:</span>{' '}
                              <span style={{ color: '#94A3B8' }}>{step.detail}</span>
                            </div>
                            <span style={{ color: '#34D399', whiteSpace: 'nowrap' }}>
                              {step.latencyMs}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
