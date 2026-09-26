import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Layers, Calendar, ArrowRight } from 'lucide-react';

export const DocumentCard = ({ doc }) => {
  const { setActiveKnowledgeDoc } = useApp();

  return (
    <div
      className="card card-hover card-stagger"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '1.25rem',
        borderRadius: '14px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <Badge variant="azure">{doc.category}</Badge>
          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
            {doc.lastIndexedAt || doc.uploadedAt}
          </span>
        </div>

        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.4rem', lineHeight: 1.3 }}>
          {doc.title}
        </h4>

        <div style={{ fontSize: '0.725rem', color: '#64748B', marginBottom: '0.6rem' }}>
          {doc.fileSizeMb} MB • {doc.totalChunks} Vector Chunks
        </div>

        <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.45, marginBottom: '0.85rem' }}>
          {doc.summary}
        </p>
      </div>

      <div style={{ paddingTop: '0.6rem', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} color="#0078D4" />
            Azure AI Search
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              color: doc.accessLevel === 'student_only' ? '#D97706' : '#059669',
              fontWeight: 600,
            }}
          >
            {doc.accessLevel === 'student_only' ? 'Protected' : 'Public'}
          </span>
        </div>

      </div>
    </div>
  );
};
