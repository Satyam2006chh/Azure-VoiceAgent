import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Calendar, Mic, Volume2, Bot, Search,
  TrendingUp, Wrench, Award, Activity, FileText, Users,
  ShieldAlert, ShieldCheck, RefreshCw, Upload, GraduationCap,
  Globe, AlertCircle, CheckCircle2, Shield
} from 'lucide-react';

const BACKEND_URL = '';
const ADMIN_TOKEN_KEY = 'univoice_admin_token';

// ─── Color palette ───
const C = {
  bg: '#050810',
  card: '#0D1224',
  cardBorder: '#1E2D4A',
  blue: '#0078D4',
  blueGlow: 'rgba(0,120,212,0.3)',
  purple: '#8B5CF6',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
};

// ─── Utility ───
const fmt = (n) => (n || 0).toLocaleString();
const TOOL_LABELS = {
  rag_university_ordinances: 'Ordinances RAG',
  get_university_overview_and_ranking: 'University Overview',
  check_library_status: 'Library Lookup',
  find_faculty_contact: 'Faculty Contact',
  check_fee_deadlines: 'Fee Deadlines',
  out_of_scope: 'Out of Scope',
};

// ─── Mini Line Chart ───
function LineChart({ data, color = C.blue }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 10, right: 10, bottom: 24, left: 32 };
    ctx.clearRect(0, 0, W, H);
    const vals = data.map(d => d.value);
    const maxV = Math.max(...vals, 1);
    const xStep = (W - pad.left - pad.right) / Math.max(data.length - 1, 1);
    const yScale = (H - pad.top - pad.bottom) / maxV;
    const x = (i) => pad.left + i * xStep;
    const y = (v) => H - pad.bottom - v * yScale;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const yy = pad.top + ((H - pad.top - pad.bottom) / 3) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(W - pad.right, yy); ctx.stroke();
    }

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    gradient.addColorStop(0, color + '55');
    gradient.addColorStop(1, color + '00');
    ctx.beginPath();
    data.forEach((d, i) => i === 0 ? ctx.moveTo(x(i), y(d.value)) : ctx.lineTo(x(i), y(d.value)));
    ctx.lineTo(x(data.length - 1), H - pad.bottom);
    ctx.lineTo(x(0), H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    data.forEach((d, i) => i === 0 ? ctx.moveTo(x(i), y(d.value)) : ctx.lineTo(x(i), y(d.value)));
    ctx.stroke();

    // Dots
    data.forEach((d, i) => {
      ctx.beginPath();
      ctx.arc(x(i), y(d.value), 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = C.card;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X labels
    ctx.fillStyle = C.textMuted;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const label = d.label.slice(5); // MM-DD
      ctx.fillText(label, x(i), H - 6);
    });
  }, [data, color]);

  return <canvas ref={canvasRef} width={560} height={160} style={{ width: '100%', height: 160 }} />;
}

// ─── Bar Chart ───
function BarChart({ data, color = C.purple }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 10, right: 10, bottom: 50, left: 10 };
    ctx.clearRect(0, 0, W, H);
    const vals = data.map(d => d.value);
    const maxV = Math.max(...vals, 1);
    const barW = (W - pad.left - pad.right) / data.length - 8;
    const yScale = (H - pad.top - pad.bottom) / maxV;

    data.forEach((d, i) => {
      const bx = pad.left + i * ((W - pad.left - pad.right) / data.length) + 4;
      const bh = d.value * yScale;
      const by = H - pad.bottom - bh;
      // Bar
      const grad = ctx.createLinearGradient(0, by, 0, H - pad.bottom);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, bh, [4, 4, 0, 0]);
      ctx.fill();
      // Value label
      ctx.fillStyle = C.textSecondary;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.value, bx + barW / 2, by - 4);
      // Label
      ctx.fillStyle = C.textMuted;
      ctx.font = '9px Inter, sans-serif';
      const labelParts = d.label.split(' ');
      labelParts.forEach((part, li) => {
        ctx.fillText(part, bx + barW / 2, H - pad.bottom + 14 + li * 12);
      });
    });
  }, [data, color]);

  return <canvas ref={canvasRef} width={500} height={180} style={{ width: '100%', height: 180 }} />;
}

// ─── Multi-Service Line Chart ───
const SVC_COLORS = {
  queries:          '#0078D4',
  sarvam_stt:       '#8B5CF6',
  sarvam_tts:       '#A78BFA',
  azure_speech_tts: '#10B981',
  azure_openai:     '#F59E0B',
  azure_search:     '#EF4444',
};
const SVC_LABELS = {
  queries:          'Queries',
  sarvam_stt:       'Sarvam STT',
  sarvam_tts:       'Sarvam TTS',
  azure_speech_tts: 'Azure Speech',
  azure_openai:     'Azure OpenAI',
  azure_search:     'Azure Search',
};

function MultiLineChart({ rows }) {
  const canvasRef = useRef(null);
  const keys = ['queries', 'sarvam_stt', 'sarvam_tts', 'azure_speech_tts', 'azure_openai', 'azure_search'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows || rows.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 14, right: 16, bottom: 30, left: 36 };
    ctx.clearRect(0, 0, W, H);

    // Use last 30 days max for readability
    const data = [...rows].reverse().slice(-30);
    const allVals = data.flatMap(r => keys.map(k => r[k] || 0));
    const maxV = Math.max(...allVals, 1);
    const xStep = (W - pad.left - pad.right) / Math.max(data.length - 1, 1);
    const yScale = (H - pad.top - pad.bottom) / maxV;
    const x = (i) => pad.left + i * xStep;
    const y = (v) => H - pad.bottom - v * yScale;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = pad.top + ((H - pad.top - pad.bottom) / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(W - pad.right, yy); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxV - (maxV / 4) * i), pad.left - 4, yy + 3);
    }

    // Lines
    keys.forEach(key => {
      const color = SVC_COLORS[key];
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      data.forEach((row, i) => {
        const v = row[key] || 0;
        i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v));
      });
      ctx.stroke();
      // Dots
      data.forEach((row, i) => {
        const v = row[key] || 0;
        ctx.beginPath();
        ctx.arc(x(i), y(v), 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    });

    // X-axis date labels (every ~5 ticks)
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    data.forEach((row, i) => {
      if (i % Math.max(1, Math.floor(data.length / 7)) === 0 || i === data.length - 1) {
        ctx.fillText(row.date.slice(5), x(i), H - 8);
      }
    });
  }, [rows]);

  return (
    <div>
      <canvas ref={canvasRef} width={760} height={180} style={{ width: '100%', height: 180 }} />
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', marginTop: '0.75rem' }}>
        {keys.map(k => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: C.textSecondary }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: SVC_COLORS[k], display: 'inline-block' }} />
            {SVC_LABELS[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const colors = {
    operational: { bg: 'rgba(16,185,129,0.15)', color: C.green, dot: C.green, label: 'Operational' },
    degraded: { bg: 'rgba(245,158,11,0.15)', color: C.yellow, dot: C.yellow, label: 'Degraded' },
    down: { bg: 'rgba(239,68,68,0.15)', color: C.red, dot: C.red, label: 'Down' },
  };
  const s = colors[status] || colors.down;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', boxShadow: `0 0 6px ${s.dot}` }} />
      {s.label}
    </span>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, sub, color = C.blue, icon: IconComponent }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #0F1630 0%, #0B0F22 100%)',
      border: '1px solid rgba(99,120,200,0.18)',
      borderRadius: 16,
      padding: '1.35rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 110,
    }}>
      {/* Top accent glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#8B9CC8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ color: '#F8FAFC', fontSize: '2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {value}
          </div>
        </div>
        {IconComponent && (
          <div style={{
            background: `${color}18`,
            border: `1px solid ${color}35`,
            borderRadius: 12,
            padding: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            boxShadow: `0 0 16px ${color}15`,
          }}>
            <IconComponent size={20} />
          </div>
        )}
      </div>
      {sub && (
        <div style={{ color: '#64748B', fontSize: '0.76rem', marginTop: 12, fontWeight: 500 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Login Page ───
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();
      if (resp.ok && data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setEmail('');
        setPassword('');
        setError('');
        onLogin(data.token);
      } else {
        setError(data.detail || 'Invalid credentials');
      }
    } catch {
      setError('Could not connect to backend. Make sure the server is running.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 24, padding: '2.5rem 2rem', width: 380, maxWidth: '90vw',
        boxShadow: `0 0 80px rgba(0,120,212,0.15)`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #0078D4, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0,120,212,0.4)',
          }}><GraduationCap size={28} color="#FFFFFF" /></div>
          <h1 style={{ color: C.textPrimary, fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>UniVoice Admin</h1>
          <p style={{ color: C.textMuted, fontSize: '0.85rem', marginTop: 6 }}>Sign in to access the dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: C.textSecondary, fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@gmail.com"
              style={{
                width: '100%', padding: '0.75rem 1rem', background: '#0A0E1A',
                border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.textPrimary,
                fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: C.textSecondary, fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '0.75rem 1rem', background: '#0A0E1A',
                border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.textPrimary,
                fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
          {error && <div style={{ color: C.red, fontSize: '0.82rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '0.85rem',
              background: 'linear-gradient(135deg, #0078D4, #0055A0)',
              border: 'none', borderRadius: 12, color: '#fff',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In to Dashboard'}
          </button>

          <div style={{
            marginTop: '1.25rem', padding: '10px 14px', borderRadius: 10,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem',
          }}>
            <div>
              <span style={{ color: C.textMuted }}>Default: </span>
              <strong style={{ color: '#60A5FA' }}>admin@gmail.com</strong>
            </div>
            <button
              type="button"
              onClick={() => { setEmail('admin@gmail.com'); setPassword('admin123'); setError(''); }}
              style={{
                background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
                color: '#93C5FD', padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              Fill Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ───
function Dashboard({ token, onLogout }) {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const authHeaders = { 'X-Admin-Token': token };

  const fetchStats = async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/stats`, { headers: authHeaders });
      if (r.ok) setStats(await r.json());
    } catch { }
  };

  const fetchHealth = async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/service-health`, { headers: authHeaders });
      if (r.ok) setHealth(await r.json());
    } catch { }
  };

  const fetchBreakdown = async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/daily-breakdown`, { headers: authHeaders });
      if (r.ok) setBreakdown(await r.json());
    } catch { }
  };

  const fetchUsers = async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: authHeaders });
      if (r.ok) setUsersData(await r.json());
    } catch { }
  };

  useEffect(() => {
    fetchStats();
    fetchHealth();
    fetchBreakdown();
    fetchUsers();
    const interval = setInterval(() => { fetchStats(); fetchBreakdown(); fetchUsers(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus('Uploading and indexing PDF...');
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/upload-pdf`, {
        method: 'POST', headers: authHeaders, body: form,
      });
      const d = await r.json();
      setUploadStatus(d.message || 'Done!');
      fetchStats();
    } catch {
      setUploadStatus('Upload failed. Check backend logs.');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Prepare chart data
  const lineData = stats ? Object.entries(stats.last_7_days || {}).map(([k, v]) => ({ label: k, value: v })) : [];
  const barData = stats ? Object.entries(stats.tool_hits || {})
    .map(([k, v]) => ({ label: TOOL_LABELS[k] || k, value: v }))
    .sort((a, b) => b.value - a.value) : [];

  const totalServiceCalls = stats
    ? Object.values(stats.service_calls_total || {}).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', 'Segoe UI', sans-serif", color: C.textPrimary }}>
      {/* Header */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.cardBorder}`,
        padding: '0 2rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(59,130,246,0.15)', padding: 6, borderRadius: 8, display: 'flex' }}>
            <GraduationCap size={20} color="#60A5FA" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: C.textPrimary }}>UniVoice Admin</div>
            <div style={{ color: C.textMuted, fontSize: '0.72rem' }}>Dashboard & Audit Center</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: C.textMuted, fontSize: '0.8rem' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <button onClick={onLogout} style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            color: C.red, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
          }}>Sign Out</button>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

        {/* ── OVERVIEW SECTION ── */}
        <div>
            {/* Stat Cards - Balanced 3x2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <StatCard label="Total Queries" value={fmt(stats?.total_queries)} sub="All-time interactions" color="#3B82F6" icon={MessageSquare} />
              <StatCard label="Today's Queries" value={fmt(stats?.today_queries)} sub={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} color="#8B5CF6" icon={Calendar} />
              <StatCard label="Sarvam AI Calls" value={fmt((stats?.service_calls_total?.sarvam_stt || 0) + (stats?.service_calls_total?.sarvam_tts || 0))} sub="STT + TTS combined" color="#34D399" icon={Mic} />
              <StatCard label="Azure Speech Calls" value={fmt(stats?.service_calls_total?.azure_speech_tts)} sub="Neural Voice TTS" color="#60A5FA" icon={Volume2} />
              <StatCard label="Azure OpenAI Calls" value={fmt(stats?.service_calls_total?.azure_openai)} sub="GPT-4.1-mini Reasoning" color="#F59E0B" icon={Bot} />
              <StatCard label="Azure Search Calls" value={fmt(stats?.service_calls_total?.azure_search)} sub="Vector + Semantic RAG" color="#EC4899" icon={Search} />
            </div>

            {/* Line Chart */}
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#60A5FA" />
                <span>Daily Queries — Last 7 Days</span>
              </div>
              {lineData.length > 0
                ? <LineChart data={lineData} color={C.blue} />
                : <div style={{ color: C.textMuted, textAlign: 'center', padding: '2rem' }}>No query data yet. Ask the assistant a question to see stats here!</div>
              }
            </div>

            {/* Bar Chart — Tool Hits */}
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={18} color="#A78BFA" />
                <span>Most Used Tools</span>
              </div>
              {barData.some(d => d.value > 0)
                ? <BarChart data={barData} color={C.purple} />
                : <div style={{ color: C.textMuted, textAlign: 'center', padding: '2rem' }}>No tool usage data yet.</div>
              }
            </div>

            {/* Top Tool Summary */}
            {barData.length > 0 && barData[0].value > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,120,212,0.1))',
                border: `1px solid rgba(139,92,246,0.3)`, borderRadius: 16, padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '1.25rem',
              }}>
                <div style={{ background: 'rgba(245,158,11,0.15)', padding: 12, borderRadius: 14 }}>
                  <Award size={30} color="#FBBF24" />
                </div>
                <div>
                  <div style={{ color: C.textMuted, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Hit Tool</div>
                  <div style={{ color: C.textPrimary, fontWeight: 800, fontSize: '1.2rem' }}>{barData[0].label}</div>
                  <div style={{ color: C.textMuted, fontSize: '0.82rem' }}>{barData[0].value} queries routed to this tool</div>
                </div>
              </div>
            )}
        </div>

        {/* ── SERVICES SECTION ── */}
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} color="#34D399" />
                <span>Live Service Health</span>
              </div>
              <button onClick={fetchHealth} style={{
                background: 'rgba(0,120,212,0.15)', border: '1px solid rgba(0,120,212,0.3)',
                color: C.blue, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {health ? Object.entries(health.services).map(([key, svc]) => (
                <div key={key} style={{
                  background: C.card, border: `1px solid ${C.cardBorder}`,
                  borderRadius: 16, padding: '1.5rem',
                  borderLeft: `4px solid ${svc.status === 'operational' ? C.green : svc.status === 'degraded' ? C.yellow : C.red}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '0.95rem' }}>{svc.name}</div>
                    <StatusBadge status={svc.status} />
                  </div>
                  {svc.model && <div style={{ color: C.textMuted, fontSize: '0.78rem' }}>Model: <span style={{ color: C.textSecondary }}>{svc.model}</span></div>}
                  {svc.region && <div style={{ color: C.textMuted, fontSize: '0.78rem' }}>Region: <span style={{ color: C.textSecondary }}>{svc.region}</span></div>}
                  {svc.index && <div style={{ color: C.textMuted, fontSize: '0.78rem' }}>Index: <span style={{ color: C.textSecondary }}>{svc.index}</span></div>}
                  {svc.error && <div style={{ color: C.red, fontSize: '0.75rem', marginTop: 4 }}>{svc.error}</div>}
                </div>
              )) : (
                <div style={{ color: C.textMuted, textAlign: 'center', padding: '3rem', gridColumn: '1/-1' }}>Loading service status...</div>
              )}
            </div>
        </div>

        {/* ── DATE-WISE BREAKDOWN SECTION ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '1.1rem' }}>📊 Date-wise Usage Breakdown</div>
              <div style={{ color: C.textMuted, fontSize: '0.82rem', marginTop: 4 }}>
                All recorded days — queries and service calls per day. Data persists across restarts.
              </div>
            </div>
            <button onClick={fetchBreakdown} style={{
              background: 'rgba(0,120,212,0.15)', border: '1px solid rgba(0,120,212,0.3)',
              color: C.blue, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
            }}>🔄 Refresh</button>
          </div>

          {/* Multi-service line chart over all recorded dates */}
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
              📈 All Services — Daily Trend
            </div>
            {breakdown?.rows?.length > 0
              ? <MultiLineChart rows={breakdown.rows} />
              : <div style={{ color: C.textMuted, textAlign: 'center', padding: '2rem' }}>No data yet. Use the assistant to start generating stats.</div>
            }
          </div>

          {/* Date-wise table */}
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.cardBorder}` }}>
                    {['Date', 'Queries', 'Sarvam STT', 'Sarvam TTS', 'Azure Speech', 'Azure OpenAI', 'Azure Search', 'Total Calls'].map(h => (
                      <th key={h} style={{
                        padding: '0.85rem 1.1rem', textAlign: 'left',
                        color: C.textMuted, fontWeight: 700, fontSize: '0.72rem',
                        textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {breakdown?.rows?.length > 0
                    ? breakdown.rows.map((row, i) => {
                        const totalCalls = (row.sarvam_stt || 0) + (row.sarvam_tts || 0) +
                          (row.azure_speech_tts || 0) + (row.azure_openai || 0) + (row.azure_search || 0);
                        const isToday = row.date === new Date().toISOString().slice(0, 10);
                        return (
                          <tr key={row.date} style={{
                            borderBottom: `1px solid ${C.cardBorder}`,
                            background: isToday ? 'rgba(0,120,212,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                            transition: 'background 0.15s',
                          }}>
                            <td style={{ padding: '0.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                              <span style={{ color: C.textPrimary, fontWeight: isToday ? 700 : 500 }}>{row.date}</span>
                              {isToday && (
                                <span style={{ marginLeft: 8, background: 'rgba(0,120,212,0.2)', color: C.blue, fontSize: '0.68rem', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>
                                  TODAY
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1.1rem', color: C.blue, fontWeight: 700 }}>{row.queries || 0}</td>
                            <td style={{ padding: '0.85rem 1.1rem', color: SVC_COLORS.sarvam_stt }}>{row.sarvam_stt || 0}</td>
                            <td style={{ padding: '0.85rem 1.1rem', color: SVC_COLORS.sarvam_tts }}>{row.sarvam_tts || 0}</td>
                            <td style={{ padding: '0.85rem 1.1rem', color: SVC_COLORS.azure_speech_tts }}>{row.azure_speech_tts || 0}</td>
                            <td style={{ padding: '0.85rem 1.1rem', color: SVC_COLORS.azure_openai }}>{row.azure_openai || 0}</td>
                            <td style={{ padding: '0.85rem 1.1rem', color: SVC_COLORS.azure_search }}>{row.azure_search || 0}</td>
                            <td style={{ padding: '0.85rem 1.1rem', color: C.textSecondary, fontWeight: 600 }}>{totalCalls}</td>
                          </tr>
                        );
                      })
                    : (
                      <tr>
                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: C.textMuted }}>
                          No daily data recorded yet.
                        </td>
                      </tr>
                    )
                  }
                </tbody>
                {breakdown?.rows?.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderTop: `1px solid ${C.cardBorder}` }}>
                      <td style={{ padding: '0.85rem 1.1rem', color: C.textMuted, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        {breakdown.total_days} day{breakdown.total_days !== 1 ? 's' : ''} total
                      </td>
                      {['queries','sarvam_stt','sarvam_tts','azure_speech_tts','azure_openai','azure_search'].map(k => (
                        <td key={k} style={{ padding: '0.85rem 1.1rem', color: C.textSecondary, fontWeight: 700 }}>
                          {breakdown.rows.reduce((s, r) => s + (r[k] || 0), 0)}
                        </td>
                      ))}
                      <td style={{ padding: '0.85rem 1.1rem', color: C.textSecondary, fontWeight: 700 }}>
                        {breakdown.rows.reduce((s, r) =>
                          s + (r.sarvam_stt||0) + (r.sarvam_tts||0) + (r.azure_speech_tts||0) + (r.azure_openai||0) + (r.azure_search||0), 0
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* ── PDF MANAGER SECTION ── */}
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#EF4444" />
                  <span>PDF Knowledge Base</span>
                </div>
                <div style={{ color: C.textMuted, fontSize: '0.82rem', marginTop: 4 }}>Uploaded PDFs are indexed into Azure AI Search for instant voice query retrieval.</div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: 'linear-gradient(135deg, #0078D4, #0055A0)',
                  border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 12,
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit',
                  opacity: uploading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <Upload size={16} />
                <span>{uploading ? 'Indexing...' : '+ Upload PDF'}</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} />
            </div>

            {uploadStatus && (
              <div style={{
                background: uploadStatus.includes('failed') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${uploadStatus.includes('failed') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                color: uploadStatus.includes('failed') ? C.red : C.green,
                padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.85rem',
              }}>
                {uploadStatus}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {(stats?.indexed_pdfs || []).length > 0
                ? stats.indexed_pdfs.map((pdf, i) => (
                  <div key={i} style={{
                    background: C.card, border: `1px solid ${C.cardBorder}`,
                    borderRadius: 14, padding: '1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={20} color="#EF4444" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ color: C.textPrimary, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pdf}</div>
                      <div style={{ color: C.green, fontSize: '0.72rem', marginTop: 2, fontWeight: 600 }}>✓ Indexed in Azure AI Search</div>
                    </div>
                  </div>
                ))
                : (
                  <div style={{
                    gridColumn: '1/-1', background: C.card, border: `1px dashed ${C.cardBorder}`,
                    borderRadius: 16, padding: '3rem', textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                      <FileText size={40} color="#475569" />
                    </div>
                    <div style={{ color: C.textSecondary, fontWeight: 600 }}>No PDFs indexed yet</div>
                    <div style={{ color: C.textMuted, fontSize: '0.82rem', marginTop: 4 }}>Upload a PDF to add it to the knowledge base</div>
                  </div>
                )}
            </div>
        </div>

        {/* ── REGISTERED USERS SECTION ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '1.1rem' }}>👥 Registered Users & Audit</div>
              <div style={{ color: C.textMuted, fontSize: '0.82rem', marginTop: 4 }}>
                Monitor all registered students and visitors. Flags users with high malicious/out-of-scope query counts.
              </div>
            </div>
            <button onClick={fetchUsers} style={{
              background: 'rgba(0,120,212,0.15)', border: '1px solid rgba(0,120,212,0.3)',
              color: C.blue, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>🔄</span> Refresh Users
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div style={{
            background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16,
            padding: '1.2rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap',
            gap: '1rem', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 260 }}>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="🔍 Filter by Email (e.g. @chitkara.edu.in), Name, or Roll No..."
                style={{
                  width: '100%', padding: '0.65rem 2.2rem 0.65rem 1rem',
                  background: '#070B18', border: '1px solid rgba(99,120,200,0.25)',
                  borderRadius: 10, color: C.textPrimary, fontSize: '0.85rem',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery('')}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: C.textMuted,
                    cursor: 'pointer', fontSize: '0.9rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'all', label: `All Users (${usersData?.total_users || (usersData?.users || []).length})` },
                { id: 'student', label: `🎓 Students (${(usersData?.users || []).filter(u => u.role === 'student').length})` },
                { id: 'visitor', label: `🌐 Visitors (${(usersData?.users || []).filter(u => u.role !== 'student').length})` },
                { id: 'flagged', label: `⚠️ Flagged (${(usersData?.users || []).filter(u => u.malicious_query_count > 0).length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setUserRoleFilter(tab.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    background: userRoleFilter === tab.id ? 'linear-gradient(135deg, #0078D4, #0055A0)' : 'rgba(255,255,255,0.05)',
                    color: userRoleFilter === tab.id ? '#FFFFFF' : C.textSecondary,
                    boxShadow: userRoleFilter === tab.id ? '0 2px 8px rgba(0,120,212,0.4)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table of Filtered Users */}
          {(() => {
            const q = userSearchQuery.toLowerCase().trim();
            const filteredUsers = (usersData?.users || []).filter(u => {
              const matchesQuery = !q || (
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.name && u.name.toLowerCase().includes(q)) ||
                (u.roll_number && String(u.roll_number).toLowerCase().includes(q)) ||
                (u.branch && u.branch.toLowerCase().includes(q))
              );
              if (!matchesQuery) return false;
              if (userRoleFilter === 'student') return u.role === 'student';
              if (userRoleFilter === 'visitor') return u.role !== 'student';
              if (userRoleFilter === 'flagged') return u.malicious_query_count > 0;
              return true;
            });

            return (
              <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.cardBorder}` }}>
                        {['Name', 'Email', 'Role', 'Roll No. (Student)', 'Daily Quota', 'Queries (Today / Total)', 'Malicious Flags'].map(h => (
                          <th key={h} style={{
                            padding: '0.85rem 1.1rem', textAlign: 'left',
                            color: C.textMuted, fontWeight: 700, fontSize: '0.72rem',
                            textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0
                        ? filteredUsers.map((u, i) => (
                          <tr key={i} style={{ borderBottom: i === filteredUsers.length - 1 ? 'none' : `1px solid ${C.cardBorder}`, background: u.malicious_query_count > 5 ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                            <td style={{ padding: '0.85rem 1.1rem', color: C.textPrimary, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {u.name}
                            </td>
                            <td style={{ padding: '0.85rem 1.1rem', color: '#60A5FA', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {u.email}
                            </td>
                            <td style={{ padding: '0.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                              {u.role === 'student'
                                ? <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>🎓 Student</span>
                                : <span style={{ background: 'rgba(156,163,175,0.15)', color: '#9CA3AF', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>🌐 Visitor</span>
                              }
                            </td>
                            <td style={{ padding: '0.85rem 1.1rem', color: C.textPrimary, fontWeight: 500 }}>
                              {u.role === 'student' && u.roll_number ? (
                                <span><span style={{ color: C.textMuted }}>Roll:</span> <strong style={{ color: '#F8FAFC' }}>{u.roll_number}</strong> {u.branch && <span style={{ fontSize: '0.72rem', color: C.textMuted, marginLeft: 4 }}>({u.branch})</span>}</span>
                              ) : (
                                <span style={{ color: C.textMuted }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1.1rem', color: C.textSecondary }}>
                              {u.daily_limit} / day
                            </td>
                            <td style={{ padding: '0.85rem 1.1rem' }}>
                              <span style={{ color: u.queries_used_today >= u.daily_limit ? C.red : C.textPrimary, fontWeight: 600 }}>{u.queries_used_today}</span>
                              <span style={{ color: C.textMuted }}> / {u.total_queries_all_time}</span>
                            </td>
                            <td style={{ padding: '0.85rem 1.1rem' }}>
                              {u.malicious_query_count > 0 ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: u.malicious_query_count > 5 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                                  color: u.malicious_query_count > 5 ? '#FCA5A5' : '#FCD34D',
                                  padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
                                }}>
                                  <span>⚠️</span> {u.malicious_query_count}
                                </span>
                              ) : (
                                <span style={{ color: C.textMuted }}>0</span>
                              )}
                            </td>
                          </tr>
                        ))
                        : (
                          <tr>
                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: C.textMuted }}>
                              {userSearchQuery ? `No users matching "${userSearchQuery}"` : 'No registered users found.'}
                            </td>
                          </tr>
                        )
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}

// ─── Main Export ───
export const AdminPage = () => {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));

  const handleLogin = (t) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, t);
    setToken(t);
  };
  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
  };

  if (!token) return <LoginPage onLogin={handleLogin} />;
  return <Dashboard token={token} onLogout={handleLogout} />;
};

export default AdminPage;
