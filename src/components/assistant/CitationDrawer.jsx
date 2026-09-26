import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  Search,
  BookOpen,
} from 'lucide-react';

export const CitationDrawer = () => {
  const { activeCitation, setActiveCitation } = useApp();

  if (!activeCitation) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
      onClick={() => setActiveCitation(null)}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0078D4',
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0078D4', textTransform: 'uppercase' }}>
                Verified RAG Citation Source
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
                {activeCitation.docTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setActiveCitation(null)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px' }}
            aria-label="Close Citation Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Document Metadata Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span className="badge badge-azure">
            {activeCitation.category}
          </span>
          <span className="badge">
            Page {activeCitation.pageNumber}
          </span>
          <span className="badge badge-success">
            <ShieldCheck size={12} />
            Confidence: {(activeCitation.confidence * 100).toFixed(1)}%
          </span>
          {activeCitation.azureSearchScore && (
            <span className="badge">
              <Search size={12} />
              Azure Vector Score: {activeCitation.azureSearchScore}
            </span>
          )}
        </div>

        {/* Section Heading */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>
            SECTION & CLAUSE REFERENCE:
          </div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>
            {activeCitation.section}
          </div>
        </div>

        {/* Exact Grounded Chunk Content */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', marginBottom: '0.4rem' }}>
            VERIFIED EXTRACT FROM AZURE AI SEARCH INDEX:
          </div>
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderLeft: '4px solid #0078D4',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: '#334155',
              fontStyle: 'italic',
            }}
          >
            "{activeCitation.snippet}"
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #E2E8F0',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Retrieved via Azure AI Search Semantic Re-ranker
          </div>
          <button
            onClick={() => setActiveCitation(null)}
            className="btn btn-primary btn-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
