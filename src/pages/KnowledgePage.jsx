import React, { useState } from 'react';
import { UNIVERSITY_DOCUMENTS } from '../data/knowledgeDocuments';
import { DocumentCard } from '../components/knowledge/DocumentCard';
import { ChunkInspectorModal } from '../components/knowledge/ChunkInspectorModal';
import { Search, Database } from 'lucide-react';

export const KnowledgePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Academic Regulations', 'Exam Notices', 'Hostel & Campus', 'Confidential Records'];

  const filteredDocs = UNIVERSITY_DOCUMENTS.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
          <span className="badge badge-azure">
            <Database size={12} />
            Knowledge Base
          </span>
          <span className="badge badge-success">Azure AI Search</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
          University Knowledge & RAG Index
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Official ordinances chunked and indexed into Azure AI Search for grounded retrieval.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search circulars, ordinances, fees..."
            style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                background: selectedCategory === cat ? '#0078D4' : '#F1F5F9',
                color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                border: 'none',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '0.7rem',
                fontWeight: selectedCategory === cat ? 700 : 500,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {filteredDocs.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>

      {/* Modal Inspector */}
      <ChunkInspectorModal />
    </div>
  );
};
