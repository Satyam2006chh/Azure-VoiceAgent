import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { X, Layers, Database, Sparkles, CheckCircle2, Search } from 'lucide-react';

export const ChunkInspectorModal = () => {
  const { activeKnowledgeDoc, setActiveKnowledgeDoc } = useApp();

  if (!activeKnowledgeDoc) return null;

  const doc = activeKnowledgeDoc;

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
      onClick={() => setActiveKnowledgeDoc(null)}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '680px',
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
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Layers size={20} color="#0078D4" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                RAG Vector Chunks Inspector
              </h3>
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Index: <code>{doc.searchIndexName || doc.azureIndexName || 'univ-academic-regulations'}</code>
            </span>
          </div>

          <button
            onClick={() => setActiveKnowledgeDoc(null)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px' }}
            aria-label="Close Chunk Inspector"
          >
            <X size={16} />
          </button>
        </div>

        {/* Doc Header Info */}
        <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem', color: '#0F172A' }}>{doc.title}</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '0.5rem' }}>
            <Badge variant="azure">{doc.category}</Badge>
            <Badge>{doc.totalChunks} Chunks Indexed</Badge>
            <Badge variant="success">Embedding: text-embedding-3-large (3072-dim)</Badge>
          </div>
        </div>

        {/* Chunks List */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            Extracted Vector Chunks in Azure AI Search
          </div>

          {(doc.sampleChunks || doc.chunks || []).map((chunk, index) => (
            <div
              key={chunk.id || chunk.chunkId || index}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0078D4', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
                  {chunk.sectionTitle || `Chunk #${chunk.chunkIndex || index + 1}`}
                </span>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#64748B' }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    Confidence: {((chunk.confidenceScore || 0.98) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#1E293B',
                  lineHeight: 1.6,
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  padding: '0.875rem',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {chunk.content}
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                <span>Model: {chunk.embeddingModel || 'text-embedding-3-large'}</span>
                <span>Dimensions: {chunk.vectorDimensions || 3072} floats</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => setActiveKnowledgeDoc(null)}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
