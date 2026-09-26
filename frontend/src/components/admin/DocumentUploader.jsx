import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export const DocumentUploader = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage('');
    } else {
      setStatus('error');
      setErrorMessage('Please select a valid PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setUploadStats(data);
      } else {
        setStatus('error');
        setErrorMessage(data.detail || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Network error occurred');
    }
  };

  return (
    <div className="card" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <UploadCloud size={20} color="#3B82F6" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Upload Official Circulars
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Ingest PDFs directly into Azure AI Search for live RAG answering.
          </p>
        </div>
      </div>

      <div 
        style={{
          border: '2px dashed var(--border-blue)',
          borderRadius: '12px',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          background: 'rgba(59,130,246,0.03)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '1.5rem'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          style={{ display: 'none' }}
        />
        
        {file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <FileText size={36} color="#3B82F6" />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <UploadCloud size={36} color="var(--text-muted)" />
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              Click or drag PDF to upload
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Supported format: .pdf
            </div>
          </div>
        )}
      </div>

      {status === 'error' && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.3)', color: '#F87171',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: '1.5rem'
        }}>
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      {status === 'success' && uploadStats && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontWeight: 700, marginBottom: 8 }}>
            <CheckCircle2 size={18} /> Successfully Indexed
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>Chunks Created: <strong style={{ color: 'var(--text-primary)' }}>{uploadStats.chunks_indexed}</strong></div>
            <div>Time Taken: <strong style={{ color: 'var(--text-primary)' }}>{uploadStats.processing_time_sec}s</strong></div>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.875rem', fontSize: '0.95rem' }}
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
      >
        {status === 'uploading' ? (
          <><Loader2 size={18} className="spin" /> Processing & Indexing...</>
        ) : (
          'Index Document in Azure'
        )}
      </button>
    </div>
  );
};
