import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Layers,
  Cpu,
  ArrowRight,
  Code2,
  Clock,
  Database,
  ShieldCheck,
} from 'lucide-react';

export const NodeDetailsDrawer = () => {
  const { activeArchitectureNode, setActiveArchitectureNode } = useApp();

  if (!activeArchitectureNode) return null;

  const node = activeArchitectureNode;

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
      onClick={() => setActiveArchitectureNode(null)}
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
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-azure" style={{ textTransform: 'uppercase' }}>
                {node.layer} Layer
              </span>
              {node.azureService && (
                <span className="badge badge-success">
                  {node.azureService}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              {node.label}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              {node.subtitle}
            </p>
          </div>

          <button
            onClick={() => setActiveArchitectureNode(null)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px' }}
            aria-label="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Technical Role & Summary */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            TECHNICAL ROLE IN PIPELINE
          </div>
          <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
            {node.description}
          </p>
        </div>

        {/* Latency SLA & Data Flow */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
            padding: '1rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0078D4', marginBottom: '2px' }}>
              LATENCY TARGET / SLA
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
              {node.latencySla}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', marginBottom: '2px' }}>
              CONNECTED PIPELINES
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
              {node.connectionsTo.length > 0 ? node.connectionsTo.join(' → ') : 'End-of-Pipeline Output'}
            </div>
          </div>
        </div>

        {/* Data Contracts (In / Out) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ borderLeft: '3px solid #0078D4', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0078D4' }}>DATA FLOW IN</div>
            <div style={{ fontSize: '0.8125rem', color: '#334155' }}>{node.dataFlowIn}</div>
          </div>
          <div style={{ borderLeft: '3px solid #7C3AED', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED' }}>DATA FLOW OUT</div>
            <div style={{ fontSize: '0.8125rem', color: '#334155' }}>{node.dataFlowOut}</div>
          </div>
        </div>

        {/* Code Snippet if present */}
        {node.sdkCodeSnippet && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.4rem' }}>
              <Code2 size={13} color="#0078D4" />
              <span>NODE.JS / AZURE SDK CODE INTEGRATION</span>
            </div>
            <pre
              style={{
                backgroundColor: '#0F172A',
                color: '#E2E8F0',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                lineHeight: 1.5,
              }}
            >
              <code>{node.sdkCodeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setActiveArchitectureNode(null)}
            className="btn btn-primary btn-sm"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
