import React from 'react';
import { VoiceController } from '../components/assistant/VoiceController';
import { ConversationFeed } from '../components/assistant/ConversationFeed';
import { ErrorFallbackSimulator } from '../components/assistant/ErrorFallbackSimulator';
import { CitationDrawer } from '../components/assistant/CitationDrawer';
import { Bot } from 'lucide-react';

export const AssistantPage = () => {
  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1rem 4rem 1rem', maxWidth: '860px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
          <span className="badge badge-azure">
            <Bot size={12} />
            Voice AI
          </span>
          <span className="badge badge-success">Azure Speech & RAG</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          University Voice Assistant
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Speak or type to receive verified answers from official university ordinances.
        </p>
      </div>

      {/* Voice Controller */}
      <VoiceController />

      {/* Conversation Feed */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            paddingBottom: '0.4rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Conversation Stream
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Azure OpenAI & Search
          </span>
        </div>
        <ConversationFeed />
      </div>

      {/* Simulator */}
      <ErrorFallbackSimulator />

      {/* Citations */}
      <CitationDrawer />
    </div>
  );
};
