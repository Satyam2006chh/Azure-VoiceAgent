import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Calendar, Mic, Volume2, Bot, Search,
  TrendingUp, Wrench, Award, Activity, FileText,
  ShieldCheck, RefreshCw, Upload, GraduationCap,
  Globe, Cpu, Zap, BarChart2, Clock, Target,
  Trash2, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

const BACKEND_URL = '';
const ADMIN_TOKEN_KEY = 'univoice_admin_token';

const C = {
  bg: '#04060F',
  card: '#080D1E',
  cardAlt: '#0C1228',
  border: 'rgba(30,45,80,0.8)',
  blue: '#2563EB',
  blueLight: '#60A5FA',
  purple: '#7C3AED',
  purpleLight: '#A78BFA',
  green: '#059669',
  greenLight: '#34D399',
  red: '#DC2626',
  redLight: '#FCA5A5',
  yellow: '#D97706',
  yellowLight: '#FCD34D',
  cyan: '#0891B2',
  cyanLight: '#67E8F9',
  pink: '#BE185D',
  pinkLight: '#F9A8D4',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
};

const fmt = (n) => (n ?? 0).toLocaleString();

const TOOL_LABELS = {
  rag_university_ordinances: 'Ordinances RAG',
  get_university_overview_and_ranking: 'Univ. Overview',
  check_library_status: 'Library Lookup',
  find_faculty_contact: 'Faculty Contact',
  check_fee_deadlines: 'Fee Deadlines',
  out_of_scope: 'Out of Scope',
};

const TOOL_COLORS = [
  '#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2',
];

const SVC_COLORS = {
  queries: '#2563EB', sarvam_stt: '#7C3AED', sarvam_tts: '#A78BFA',
  azure_speech_tts: '#059669', azure_openai: '#D97706', azure_search: '#DC2626',
};
const SVC_LABELS = {
  queries: 'Queries', sarvam_stt: 'Sarvam STT', sarvam_tts: 'Sarvam TTS',
  azure_speech_tts: 'Azure Speech', azure_openai: 'Azure OpenAI', azure_search: 'Azure Search',
};

// ─── Donut Chart ─────────────────────────────────────────────────
function DonutChart({ data }) {
  const size = 220, cx = 110, cy = 110, r = 80, thickness = 28;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumAngle = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...d, x1, y1, x2, y2, large, angle, color: TOOL_COLORS[i % TOOL_COLORS.length] };
  });

  const [hovered, setHovered] = useState(null);
  const topItem = data.reduce((a, b) => b.value > a.value ? b : a, data[0] || { label: '—', value: 0 });

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size}>
          {/* Background circle */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thickness} />
          {arcs.map((arc, i) => arc.angle > 0.01 && (
            <path
              key={i}
              d={`M ${arc.x1} ${arc.y1} A ${r} ${r} 0 ${arc.large} 1 ${arc.x2} ${arc.y2}`}
              fill="none"
              stroke={arc.color}
              strokeWidth={hovered === i ? thickness + 6 : thickness}
              strokeLinecap="round"
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s', filter: hovered === i ? `drop-shadow(0 0 8px ${arc.color})` : 'none' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center label */}
          <text x={cx} y={cy - 10} textAnchor="middle" fill={C.textPrimary} fontSize="22" fontWeight="800">
            {hovered !== null ? arcs[hovered]?.value : total}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill={C.textMuted} fontSize="11">
            {hovered !== null ? 'queries' : 'total'}
          </text>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        {arcs.map((arc, i) => (
          <div key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 10, marginBottom: 4,
              background: hovered === i ? `${arc.color}15` : 'transparent',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: arc.color, flexShrink: 0, boxShadow: `0 0 6px ${arc.color}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: C.textPrimary, fontSize: '0.8rem', fontWeight: 600 }}>{arc.label}</div>
              <div style={{ color: C.textMuted, fontSize: '0.7rem' }}>{arc.value} — {Math.round(arc.value / total * 100)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Line Chart ──────────────────────────────────────────────────
function LineChart({ data, color = '#2563EB' }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 14, right: 16, bottom: 28, left: 38 };
    ctx.clearRect(0, 0, W, H);
    const vals = data.map(d => d.value);
    const maxV = Math.max(...vals, 1);
    const xStep = (W - pad.left - pad.right) / Math.max(data.length - 1, 1);
    const yS = (H - pad.top - pad.bottom) / maxV;
    const x = i => pad.left + i * xStep;
    const y = v => H - pad.bottom - v * yS;

    for (let i = 0; i <= 4; i++) {
      const yy = pad.top + ((H - pad.top - pad.bottom) / 4) * i;
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(W - pad.right, yy); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxV - (maxV / 4) * i), pad.left - 4, yy + 3);
    }

    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, color + '40'); grad.addColorStop(1, color + '00');
    ctx.beginPath();
    data.forEach((d, i) => i === 0 ? ctx.moveTo(x(i), y(d.value)) : ctx.lineTo(x(i), y(d.value)));
    ctx.lineTo(x(data.length - 1), H - pad.bottom); ctx.lineTo(x(0), H - pad.bottom);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    data.forEach((d, i) => i === 0 ? ctx.moveTo(x(i), y(d.value)) : ctx.lineTo(x(i), y(d.value)));
    ctx.stroke();

    data.forEach((d, i) => {
      ctx.beginPath(); ctx.arc(x(i), y(d.value), 4, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = C.card; ctx.lineWidth = 2; ctx.stroke();
    });

    ctx.fillStyle = C.textMuted; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
    data.forEach((d, i) => ctx.fillText(d.label.slice(5), x(i), H - 8));
  }, [data, color]);

  return <canvas ref={canvasRef} width={580} height={170} style={{ width: '100%', height: 170 }} />;
}

// ─── Multi-line chart ────────────────────────────────────────────
function MultiLineChart({ rows }) {
  const canvasRef = useRef(null);
  const keys = ['queries','sarvam_stt','sarvam_tts','azure_speech_tts','azure_openai','azure_search'];
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows?.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 14, right: 16, bottom: 30, left: 36 };
    ctx.clearRect(0, 0, W, H);
    const data = [...rows].reverse().slice(-30);
    const allVals = data.flatMap(r => keys.map(k => r[k] || 0));
    const maxV = Math.max(...allVals, 1);
    const xStep = (W - pad.left - pad.right) / Math.max(data.length - 1, 1);
    const yS = (H - pad.top - pad.bottom) / maxV;
    const x = i => pad.left + i * xStep;
    const y = v => H - pad.bottom - v * yS;

    for (let i = 0; i <= 4; i++) {
      const yy = pad.top + ((H - pad.top - pad.bottom) / 4) * i;
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(W - pad.right, yy); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxV - (maxV / 4) * i), pad.left - 4, yy + 3);
    }
    keys.forEach(key => {
      const color = SVC_COLORS[key];
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      data.forEach((row, i) => { const v = row[key] || 0; i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v)); });
      ctx.stroke();
      data.forEach((row, i) => {
        ctx.beginPath(); ctx.arc(x(i), y(row[key] || 0), 3, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      });
    });
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center';
    data.forEach((row, i) => {
      if (i % Math.max(1, Math.floor(data.length / 7)) === 0 || i === data.length - 1)
        ctx.fillText(row.date.slice(5), x(i), H - 8);
    });
  }, [rows]);

  return (
    <div>
      <canvas ref={canvasRef} width={800} height={190} style={{ width: '100%', height: 190 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.2rem', marginTop: '0.75rem' }}>
        {keys.map(k => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.73rem', color: C.textSecondary }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: SVC_COLORS[k], display: 'inline-block' }} />
            {SVC_LABELS[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}10 0%, ${C.card} 60%)`,
      border: `1px solid ${color}30`,
      borderRadius: 20, padding: '1.6rem 1.75rem',
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 4px 24px ${color}12, 0 1px 3px rgba(0,0,0,0.4)`,
      display: 'flex', flexDirection: 'column', gap: '1rem',
      minHeight: 140,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}00)` }} />
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: `${color}08`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: C.textMuted, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <div style={{ background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 12, padding: '8px', display: 'flex', color }}>
          {Icon && <Icon size={18} />}
        </div>
      </div>

      <div>
        <div style={{ color: C.textPrimary, fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>{value ?? '—'}</div>
        {sub && <div style={{ color: C.textMuted, fontSize: '0.78rem', marginTop: 6, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    operational: { bg: 'rgba(5,150,105,0.15)', color: '#34D399', label: '● Operational' },
    degraded:    { bg: 'rgba(217,119,6,0.15)',  color: '#FCD34D', label: '● Degraded' },
    down:        { bg: 'rgba(220,38,38,0.15)',  color: '#FCA5A5', label: '● Down' },
  };
  const s = map[status] || map.down;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 11px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

// ─── Login Page ──────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (r.ok && d.token) { localStorage.setItem(ADMIN_TOKEN_KEY, d.token); onLogin(d.token); }
      else setError(d.detail || 'Invalid credentials');
    } catch { setError('Cannot connect to backend.'); }
    setLoading(false);
  };

  const inp = {
    width: '100%', padding: '0.8rem 1rem', background: '#060912',
    border: `1px solid ${C.border}`, borderRadius: 12, color: C.textPrimary,
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 28, padding: '2.8rem 2.4rem', width: 400, maxWidth: '92vw', boxShadow: '0 0 80px rgba(37,99,235,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.1rem', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(37,99,235,0.4)' }}>
            <GraduationCap size={30} color="#fff" />
          </div>
          <h1 style={{ color: C.textPrimary, fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>UniVoice Admin</h1>
          <p style={{ color: C.textMuted, fontSize: '0.85rem', marginTop: 6 }}>Control Center · AI Operations</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ color: C.textSecondary, fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@gmail.com" style={inp} />
          </div>
          <div>
            <label style={{ color: C.textSecondary, fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inp} />
          </div>
          {error && <div style={{ color: C.redLight, fontSize: '0.82rem', textAlign: 'center', background: 'rgba(220,38,38,0.1)', padding: '8px', borderRadius: 8 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: '0.9rem', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In to Dashboard'}
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 10, padding: '10px 14px', fontSize: '0.78rem' }}>
            <span style={{ color: C.textMuted }}>Default: <strong style={{ color: C.blueLight }}>admin@gmail.com</strong></span>
            <button type="button" onClick={() => { setEmail('admin@gmail.com'); setPassword('admin123'); }} style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)', color: '#93C5FD', padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit' }}>
              Fill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────
function Dashboard({ token, onLogout }) {
  const [stats, setStats]         = useState(null);
  const [health, setHealth]       = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [pdfsData, setPdfsData]   = useState(null);
  const [langData, setLangData]   = useState(null);
  const [aiOps, setAiOps]         = useState(null);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter]   = useState('all');
  const [uploadStatus, setUploadStatus]       = useState('');
  const [uploading, setUploading]             = useState(false);
  const [deletingPdf, setDeletingPdf]         = useState(null);

  // Date picker for breakdown
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const fileInputRef = useRef(null);

  // Use a ref for headers so refresh/fetch_ always uses the current token
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const fetch_ = useCallback(async (url, setter) => {
    try {
      const r = await fetch(`${BACKEND_URL}${url}`, {
        headers: { 'X-Admin-Token': tokenRef.current }
      });
      if (r.ok) setter(await r.json());
    } catch {}
  }, []);

  const refresh = useCallback(() => {
    fetch_('/api/admin/stats',              setStats);
    fetch_('/api/admin/daily-breakdown',    setBreakdown);
    fetch_('/api/admin/users',              setUsersData);
    fetch_('/api/admin/pdfs',              setPdfsData);
    fetch_('/api/admin/language-analytics', setLangData);
    fetch_('/api/admin/ai-operations',      setAiOps);
  }, [fetch_]);

  useEffect(() => {
    refresh();
    fetch_('/api/admin/service-health', setHealth);
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh, fetch_]);

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true); setUploadStatus('Uploading & indexing PDF...');
    const form = new FormData(); form.append('file', file);
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/upload-pdf`, {
        method: 'POST',
        headers: { 'X-Admin-Token': tokenRef.current },
        body: form,
      });
      const d = await r.json();
      setUploadStatus(d.message || 'Done!');
      fetch_('/api/admin/pdfs', setPdfsData);
      fetch_('/api/admin/stats', setStats);
    } catch { setUploadStatus('Upload failed. Check backend logs.'); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePdf = async (filename) => {
    if (!window.confirm(`Delete "${filename}"?\n\nThis removes it from Azure AI Search permanently.`)) return;
    setDeletingPdf(filename);
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/pdfs/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': tokenRef.current },
      });
      const d = await r.json();
      setUploadStatus(r.ok ? `✓ ${d.message}` : `✗ ${d.detail || 'Delete failed'}`);
    } catch { setUploadStatus('✗ Delete failed.'); }
    setDeletingPdf(null);
    fetch_('/api/admin/pdfs', setPdfsData);
    fetch_('/api/admin/stats', setStats);
  };

  // Derived chart data
  const lineData  = stats ? Object.entries(stats.last_7_days || {}).map(([k, v]) => ({ label: k, value: v })) : [];
  const donutData = stats ? Object.entries(stats.tool_hits || {})
    .map(([k, v]) => ({ label: TOOL_LABELS[k] || k, value: v }))
    .filter(d => d.value > 0).sort((a, b) => b.value - a.value) : [];

  // Date filtered rows
  const filteredRows = (breakdown?.rows || []).filter(row => {
    if (dateFrom && row.date < dateFrom) return false;
    if (dateTo   && row.date > dateTo)   return false;
    return true;
  });

  const sectionTitle = (icon, title, sub) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ color: C.blueLight }}>{icon}</div>
        <span style={{ color: C.textPrimary, fontWeight: 800, fontSize: '1.15rem' }}>{title}</span>
      </div>
      {sub && <div style={{ color: C.textMuted, fontSize: '0.82rem', marginTop: 4, paddingLeft: 28 }}>{sub}</div>}
    </div>
  );

  const card = (children, extra = {}) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: '1.5rem', ...extra }}>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter','Segoe UI',sans-serif", color: C.textPrimary }}>

      {/* ── Header ── */}
      <div style={{
        background: 'rgba(8,13,30,0.95)', borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)', padding: '0 2.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, position: 'sticky', top: 0, zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'rgba(37,99,235,0.2)', padding: 8, borderRadius: 12, display: 'flex', border: '1px solid rgba(37,99,235,0.3)' }}>
            <ShieldCheck size={20} color="#60A5FA" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: C.textPrimary, letterSpacing: '-0.01em' }}>UniVoice Admin</div>
            <div style={{ color: C.textMuted, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Dashboard & Audit Center</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <span style={{ color: C.textMuted, fontSize: '0.82rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', color: C.blueLight, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Refresh All
          </button>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.28)', color: '#FCA5A5', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ padding: '2.5rem', maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>

        {/* ─────────────────────────────────────────────────────── */}
        {/* 1. KPI STAT CARDS                                      */}
        {/* ─────────────────────────────────────────────────────── */}
        <section>
          {sectionTitle(<TrendingUp size={20} />, 'Overview', 'Live system metrics — all data pulled from telemetry')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <StatCard label="Total Queries" value={fmt(stats?.total_queries)} sub="All-time voice interactions" color="#2563EB" icon={MessageSquare} />
            <StatCard label="Today's Queries" value={fmt(stats?.today_queries)} sub={new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} color="#7C3AED" icon={Calendar} />
            <StatCard label="Sarvam AI Calls" value={fmt((stats?.service_calls_total?.sarvam_stt||0)+(stats?.service_calls_total?.sarvam_tts||0))} sub="STT + TTS combined" color="#059669" icon={Mic} />
            <StatCard label="Azure Speech" value={fmt(stats?.service_calls_total?.azure_speech_tts)} sub="Neural Voice TTS" color="#0891B2" icon={Volume2} />
            <StatCard label="Azure OpenAI" value={fmt(stats?.service_calls_total?.azure_openai)} sub="GPT-4.1-mini calls" color="#D97706" icon={Bot} />
            <StatCard label="Azure Search" value={fmt(stats?.service_calls_total?.azure_search)} sub="Vector + Semantic RAG" color="#BE185D" icon={Search} />
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────── */}
        {/* 2. AI OPERATIONS & COST CONTROL CENTER                  */}
        {/* ─────────────────────────────────────────────────────── */}
        <section>
          {sectionTitle(<Cpu size={20} />, 'AI Operations & Cost Control', "Today's AI system performance — all values are live from telemetry")}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* TODAY row */}
            <div style={{ background: `linear-gradient(135deg, rgba(37,99,235,0.08), ${C.card})`, border: `1px solid rgba(37,99,235,0.2)`, borderRadius: 18, padding: '1.75rem', gridColumn: '1 / -1' }}>
              <div style={{ color: C.textMuted, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>TODAY — {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
                {[
                  { label: 'Queries', value: fmt(aiOps?.today?.queries), icon: <MessageSquare size={16}/>, color: C.blueLight },
                  { label: 'Avg Response', value: aiOps?.today?.avg_latency_ms > 0 ? `${aiOps.today.avg_latency_sec}s` : '—', icon: <Clock size={16}/>, color: C.cyanLight },
                  { label: 'RAG Grounded', value: aiOps?.today?.queries > 0 ? `${aiOps.today.rag_grounded_pct}%` : '—', icon: <Target size={16}/>, color: C.greenLight },
                  { label: 'Out-of-Scope', value: fmt(aiOps?.today?.out_of_scope_count), icon: <Zap size={16}/>, color: C.yellowLight },
                  { label: 'AI Calls Today', value: fmt(aiOps?.total_service_calls_today), icon: <BarChart2 size={16}/>, color: C.purpleLight },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: m.color, marginBottom: 6 }}>
                      {m.icon}
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted }}>{m.label}</span>
                    </div>
                    <div style={{ color: C.textPrimary, fontSize: '2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{m.value ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI USAGE bars */}
            {card(
              <div>
                <div style={{ color: C.textSecondary, fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem' }}>AI Usage — Today</div>
                {(aiOps?.ai_usage || []).map((svc, i) => (
                  <div key={i} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ color: C.textSecondary, fontSize: '0.82rem', fontWeight: 600 }}>{svc.service}</span>
                      <span style={{ color: svc.color, fontWeight: 800, fontSize: '0.82rem' }}>{svc.calls_today} calls · {svc.pct}%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${svc.pct}%`, height: '100%', background: `linear-gradient(90deg, ${svc.color}, ${svc.color}99)`, borderRadius: 6, transition: 'width 0.8s ease', minWidth: svc.calls_today > 0 ? 6 : 0 }} />
                    </div>
                  </div>
                ))}
                {!aiOps?.ai_usage?.length && <div style={{ color: C.textMuted, fontSize: '0.85rem' }}>No AI calls recorded today yet.</div>}
              </div>
            )}

            {/* 7-day line chart */}
            {card(
              <div>
                <div style={{ color: C.textSecondary, fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Queries — Last 7 Days</div>
                {lineData.length > 0
                  ? <LineChart data={lineData} color="#2563EB" />
                  : <div style={{ color: C.textMuted, textAlign: 'center', padding: '2rem' }}>No data yet.</div>
                }
              </div>
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────── */}
        {/* 3. TOOL HIT DONUT CHART                                 */}
        {/* ─────────────────────────────────────────────────────── */}
        <section>
          {sectionTitle(<Wrench size={20} />, 'Tool Usage Distribution', 'Which tools students trigger most — hover to inspect')}
          {card(
            donutData.some(d => d.value > 0)
              ? <DonutChart data={donutData} />
              : <div style={{ color: C.textMuted, textAlign: 'center', padding: '2rem' }}>No tool usage recorded yet.</div>
          )}
        </section>

        {/* ─────────────────────────────────────────────────────── */}
        {/* 4. LIVE SERVICE HEALTH                                  */}
        {/* ─────────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Activity size={20} color={C.blueLight} />
                <span style={{ color: C.textPrimary, fontWeight: 800, fontSize: '1.15rem' }}>Live Service Health</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: '0.82rem', paddingLeft: 30 }}>Real-time ping to all 4 integrated AI services</div>
            </div>
            <button onClick={() => fetch_('/api/admin/service-health', setHealth)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', color: C.blueLight, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {health ? Object.entries(health.services).map(([key, svc]) => {
              const sc = svc.status === 'operational' ? '#059669' : svc.status === 'degraded' ? '#D97706' : '#DC2626';
              return (
                <div key={key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: '1.5rem', borderLeft: `4px solid ${sc}`, boxShadow: `0 0 20px ${sc}10` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ color: C.textPrimary, fontWeight: 800, fontSize: '0.95rem' }}>{svc.name}</div>
                    <StatusBadge status={svc.status} />
                  </div>
                  {svc.model  && <div style={{ color: C.textMuted, fontSize: '0.78rem', marginTop: 4 }}>Model: <span style={{ color: C.textSecondary }}>{svc.model}</span></div>}
                  {svc.region && <div style={{ color: C.textMuted, fontSize: '0.78rem', marginTop: 4 }}>Region: <span style={{ color: C.textSecondary }}>{svc.region}</span></div>}
                  {svc.index  && <div style={{ color: C.textMuted, fontSize: '0.78rem', marginTop: 4 }}>Index: <span style={{ color: C.textSecondary }}>{svc.index}</span></div>}
                  {svc.error  && <div style={{ color: '#FCA5A5', fontSize: '0.75rem', marginTop: 6 }}>{svc.error}</div>}
                </div>
              );
            }) : <div style={{ color: C.textMuted, textAlign: 'center', padding: '3rem', gridColumn: '1/-1' }}>Loading…</div>}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────── */}
        {/* 5. DATE-WISE BREAKDOWN + DATE PICKER                    */}
        {/* ─────────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Calendar size={20} color={C.blueLight} />
                <span style={{ color: C.textPrimary, fontWeight: 800, fontSize: '1.15rem' }}>Date-wise Usage Breakdown</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: '0.82rem', paddingLeft: 30 }}>Filter by date range · all service calls per day</div>
            </div>
            {/* Date range picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: C.textMuted, fontSize: '0.78rem', fontWeight: 600 }}>FROM</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={dateTo || today}
                  style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textPrimary, padding: '6px 10px', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: C.textMuted, fontSize: '0.78rem', fontWeight: 600 }}>TO</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom} max={today}
                  style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textPrimary, padding: '6px 10px', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }} />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#FCA5A5', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear
                </button>
              )}
              <button onClick={() => fetch_('/api/admin/daily-breakdown', setBreakdown)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', color: C.blueLight, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {/* Multi-service trend chart */}
          {card(
            <div>
              <div style={{ color: C.textSecondary, fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>All Services — Daily Trend</div>
              {filteredRows.length > 0
                ? <MultiLineChart rows={filteredRows} />
                : <div style={{ color: C.textMuted, textAlign: 'center', padding: '2rem' }}>No data in selected range.</div>
              }
            </div>,
            { marginBottom: '1.25rem' }
          )}

          {/* Table */}
          {card(
            <div style={{ overflowX: 'auto' }}>
              {dateFrom || dateTo ? (
                <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: C.blueLight, fontWeight: 600 }}>
                  Showing {filteredRows.length} of {breakdown?.rows?.length || 0} days
                  {dateFrom ? ` · from ${dateFrom}` : ''}
                  {dateTo   ? ` · to ${dateTo}`   : ''}
                </div>
              ) : null}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.border}` }}>
                    {['Date','Queries','Sarvam STT','Sarvam TTS','Azure Speech','Azure OpenAI','Azure Search','Total Calls'].map(h => (
                      <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: C.textMuted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length > 0 ? filteredRows.map((row, i) => {
                    const tot = (row.sarvam_stt||0)+(row.sarvam_tts||0)+(row.azure_speech_tts||0)+(row.azure_openai||0)+(row.azure_search||0);
                    const isToday = row.date === today;
                    return (
                      <tr key={row.date} style={{ borderBottom: `1px solid ${C.border}`, background: isToday ? 'rgba(37,99,235,0.05)' : i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ color: C.textPrimary, fontWeight: isToday ? 800 : 500 }}>{row.date}</span>
                          {isToday && <span style={{ marginLeft: 8, background: 'rgba(37,99,235,0.2)', color: C.blueLight, fontSize: '0.65rem', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>TODAY</span>}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: SVC_COLORS.queries, fontWeight: 700 }}>{row.queries||0}</td>
                        <td style={{ padding: '0.85rem 1rem', color: SVC_COLORS.sarvam_stt }}>{row.sarvam_stt||0}</td>
                        <td style={{ padding: '0.85rem 1rem', color: SVC_COLORS.sarvam_tts }}>{row.sarvam_tts||0}</td>
                        <td style={{ padding: '0.85rem 1rem', color: SVC_COLORS.azure_speech_tts }}>{row.azure_speech_tts||0}</td>
                        <td style={{ padding: '0.85rem 1rem', color: SVC_COLORS.azure_openai }}>{row.azure_openai||0}</td>
                        <td style={{ padding: '0.85rem 1rem', color: SVC_COLORS.azure_search }}>{row.azure_search||0}</td>
                        <td style={{ padding: '0.85rem 1rem', color: C.textSecondary, fontWeight: 700 }}>{tot}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: C.textMuted }}>No records found.</td></tr>
                  )}
                </tbody>
                {filteredRows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: '0.85rem 1rem', color: C.textMuted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>{filteredRows.length} day{filteredRows.length!==1?'s':''}</td>
                      {['queries','sarvam_stt','sarvam_tts','azure_speech_tts','azure_openai','azure_search'].map(k => (
                        <td key={k} style={{ padding: '0.85rem 1rem', color: C.textSecondary, fontWeight: 800 }}>
                          {filteredRows.reduce((s,r)=>s+(r[k]||0),0)}
                        </td>
                      ))}
                      <td style={{ padding: '0.85rem 1rem', color: C.textSecondary, fontWeight: 800 }}>
                        {filteredRows.reduce((s,r)=>(s+(r.sarvam_stt||0)+(r.sarvam_tts||0)+(r.azure_speech_tts||0)+(r.azure_openai||0)+(r.azure_search||0)),0)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </section>

        {/* ─────────────────────────────────────────────────────── */}
        {/* 6. PDF KNOWLEDGE BASE                                   */}
        {/* ─────────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <FileText size={20} color="#FCA5A5" />
                <span style={{ color: C.textPrimary, fontWeight: 800, fontSize: '1.15rem' }}>PDF Knowledge Base</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: '0.82rem', paddingLeft: 30 }}>
                {pdfsData ? `${pdfsData.total} PDF${pdfsData.total!==1?'s':''} · uploaded files are chunked & indexed into Azure AI Search` : 'Upload PDFs to grow the knowledge base'}
              </div>
            </div>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: uploading ? 0.6 : 1, fontFamily: 'inherit' }}>
              <Upload size={16} /> {uploading ? 'Indexing…' : '+ Upload PDF'}
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} />
          </div>

          {uploadStatus && (
            <div style={{
              background: uploadStatus.startsWith('✗') ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)',
              border: `1px solid ${uploadStatus.startsWith('✗') ? 'rgba(220,38,38,0.25)' : 'rgba(5,150,105,0.25)'}`,
              color: uploadStatus.startsWith('✗') ? '#FCA5A5' : '#34D399',
              padding: '0.75rem 1.1rem', borderRadius: 12, marginBottom: '1rem', fontSize: '0.85rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{uploadStatus}</span>
              <button onClick={() => setUploadStatus('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
            {(pdfsData?.pdfs || []).length > 0 ? pdfsData.pdfs.map((pdf, i) => (
              <div key={i} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: '1.25rem',
                display: 'flex', flexDirection: 'column', gap: '0.9rem',
                opacity: deletingPdf === pdf.filename ? 0.4 : 1, transition: 'opacity 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: pdf.indexed ? 'rgba(5,150,105,0.15)' : 'rgba(217,119,6,0.15)',
                    border: `1px solid ${pdf.indexed ? 'rgba(5,150,105,0.3)' : 'rgba(217,119,6,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={18} color={pdf.indexed ? '#34D399' : '#FCD34D'} />
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pdf.filename}>{pdf.filename}</div>
                    <div style={{ color: C.textMuted, fontSize: '0.72rem', marginTop: 2 }}>
                      {pdf.size_kb} KB · {new Date(pdf.uploaded_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pdf.indexed ? '#34D399' : '#FCD34D', background: pdf.indexed ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)', padding: '3px 9px', borderRadius: 8 }}>
                    {pdf.indexed ? '✓ Indexed in Azure Search' : '⚠ Not yet indexed'}
                  </span>
                  <button onClick={() => handleDeletePdf(pdf.filename)} disabled={deletingPdf === pdf.filename}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.22)', color: '#FCA5A5', padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(220,38,38,0.1)'}>
                    <Trash2 size={13} /> {deletingPdf===pdf.filename?'Deleting…':'Delete'}
                  </button>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1/-1', background: C.card, border: `1px dashed ${C.border}`, borderRadius: 18, padding: '3.5rem', textAlign: 'center' }}>
                <FileText size={44} color={C.textMuted} style={{ margin: '0 auto 1rem' }} />
                <div style={{ color: C.textSecondary, fontWeight: 700 }}>No PDFs in knowledge base yet</div>
                <div style={{ color: C.textMuted, fontSize: '0.82rem', marginTop: 4 }}>Upload a PDF to add it to the voice assistant's knowledge</div>
              </div>
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────── */}
        {/* 7. LANGUAGE ANALYTICS                                   */}
        {/* ─────────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Globe size={20} color={C.purpleLight} />
                <span style={{ color: C.textPrimary, fontWeight: 800, fontSize: '1.15rem' }}>Language Usage Analytics</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: '0.82rem', paddingLeft: 30 }}>Which languages students speak — and how fast each one responds</div>
            </div>
            <button onClick={() => fetch_('/api/admin/language-analytics', setLangData)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: C.purpleLight, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {langData && langData.total_queries > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Tracked', value: fmt(langData.total_queries), color: C.blueLight },
                  { label: 'Languages Used', value: langData.total_languages_used, color: C.purpleLight },
                  { label: 'Top Language', value: langData.languages[0]?.language_name || '—', sub: `${langData.languages[0]?.percentage || 0}% of queries`, color: C.greenLight },
                ].map((m, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '1rem 1.5rem', minWidth: 150 }}>
                    <div style={{ color: C.textMuted, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{m.label}</div>
                    <div style={{ color: m.color, fontSize: '1.8rem', fontWeight: 900, lineHeight: 1 }}>{m.value}</div>
                    {m.sub && <div style={{ color: C.textMuted, fontSize: '0.72rem', marginTop: 4 }}>{m.sub}</div>}
                  </div>
                ))}
              </div>
              {card(
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.border}` }}>
                        {['Language','Queries','Share','Usage Bar','Avg Latency'].map(h => (
                          <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: C.textMuted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {langData.languages.map((lang, i) => {
                        const COLS=['#7C3AED','#2563EB','#059669','#D97706','#DC2626','#0891B2','#84CC16','#F97316','#6366F1'];
                        const color = COLS[i % COLS.length];
                        return (
                          <tr key={lang.language_code} style={{ borderBottom: `1px solid ${C.border}`, background: i===0 ? 'rgba(124,58,237,0.04)' : 'transparent' }}>
                            <td style={{ padding: '0.9rem 1rem' }}>
                              <div style={{ color: C.textPrimary, fontWeight: 700 }}>{lang.language_name}</div>
                              <div style={{ color: C.textMuted, fontSize: '0.7rem' }}>{lang.language_code}</div>
                            </td>
                            <td style={{ padding: '0.9rem 1rem', color, fontWeight: 800 }}>{fmt(lang.query_count)}</td>
                            <td style={{ padding: '0.9rem 1rem', color: C.textSecondary, fontWeight: 600 }}>{lang.percentage}%</td>
                            <td style={{ padding: '0.9rem 1rem', minWidth: 160 }}>
                              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                                <div style={{ width: `${lang.percentage}%`, height: '100%', background: `linear-gradient(90deg,${color},${color}99)`, borderRadius: 6, transition: 'width 0.6s ease' }} />
                              </div>
                            </td>
                            <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                              {lang.avg_latency_ms > 0 ? (
                                <span style={{ color: lang.avg_latency_ms < 2000 ? '#34D399' : lang.avg_latency_ms < 4000 ? '#FCD34D' : '#FCA5A5', fontWeight: 700 }}>
                                  {lang.avg_latency_ms < 1000 ? `${lang.avg_latency_ms}ms` : `${(lang.avg_latency_ms/1000).toFixed(1)}s`}
                                </span>
                              ) : <span style={{ color: C.textMuted }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 18, padding: '3.5rem', textAlign: 'center' }}>
              <Globe size={44} color={C.textMuted} style={{ margin: '0 auto 1rem', display: 'block' }} />
              <div style={{ color: C.textSecondary, fontWeight: 700 }}>No language data yet</div>
              <div style={{ color: C.textMuted, fontSize: '0.82rem', marginTop: 4 }}>Stats appear after students use the voice assistant</div>
            </div>
          )}
        </section>

        {/* ─────────────────────────────────────────────────────── */}
        {/* 8. REGISTERED USERS & AUDIT                             */}
        {/* ─────────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <ShieldCheck size={20} color={C.greenLight} />
                <span style={{ color: C.textPrimary, fontWeight: 800, fontSize: '1.15rem' }}>Registered Users & Audit</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: '0.82rem', paddingLeft: 30 }}>Monitor students and visitors · flags users with high out-of-scope counts</div>
            </div>
            <button onClick={() => fetch_('/api/admin/users', setUsersData)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', color: C.greenLight, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13} /> Refresh Users
            </button>
          </div>

          {/* Search + filter */}
          {card(
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 260 }}>
                <input type="text" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)}
                  placeholder="🔍 Search by email, name or roll number..."
                  style={{ width: '100%', padding: '0.7rem 2rem 0.7rem 1rem', background: '#060912', border: `1px solid ${C.border}`, borderRadius: 12, color: C.textPrimary, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                {userSearchQuery && <button onClick={() => setUserSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>✕</button>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all',     label: `All (${usersData?.total_users||0})` },
                  { id: 'student', label: `🎓 Students (${(usersData?.users||[]).filter(u=>u.role==='student').length})` },
                  { id: 'visitor', label: `🌐 Visitors (${(usersData?.users||[]).filter(u=>u.role!=='student').length})` },
                  { id: 'flagged', label: `⚠️ Flagged (${(usersData?.users||[]).filter(u=>u.malicious_query_count>0).length})` },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setUserRoleFilter(tab.id)} style={{
                    padding: '6px 14px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    background: userRoleFilter===tab.id ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : 'rgba(255,255,255,0.04)',
                    border: userRoleFilter===tab.id ? 'none' : `1px solid ${C.border}`,
                    color: userRoleFilter===tab.id ? '#fff' : C.textSecondary,
                    boxShadow: userRoleFilter===tab.id ? '0 2px 12px rgba(37,99,235,0.4)' : 'none',
                  }}>{tab.label}</button>
                ))}
              </div>
            </div>,
            { marginBottom: '1rem' }
          )}

          {card(
            <div style={{ overflowX: 'auto' }}>
              {(() => {
                const q = userSearchQuery.toLowerCase().trim();
                const filtered = (usersData?.users||[]).filter(u => {
                  const m = !q || (u.email?.toLowerCase().includes(q)||u.name?.toLowerCase().includes(q)||String(u.roll_number||'').includes(q)||String(u.branch||'').toLowerCase().includes(q));
                  if (!m) return false;
                  if (userRoleFilter==='student') return u.role==='student';
                  if (userRoleFilter==='visitor') return u.role!=='student';
                  if (userRoleFilter==='flagged') return u.malicious_query_count>0;
                  return true;
                });
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.border}` }}>
                        {['Name','Email','Role','Roll No.','Daily Quota','Today / Total','Flags'].map(h => (
                          <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: C.textMuted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length > 0 ? filtered.map((u, i) => (
                        <tr key={i} style={{ borderBottom: i===filtered.length-1?'none':`1px solid ${C.border}`, background: u.malicious_query_count>5 ? 'rgba(220,38,38,0.03)' : 'transparent' }}>
                          <td style={{ padding: '0.9rem 1rem', color: C.textPrimary, fontWeight: 700, whiteSpace: 'nowrap' }}>{u.name}</td>
                          <td style={{ padding: '0.9rem 1rem', color: C.blueLight, whiteSpace: 'nowrap' }}>{u.email}</td>
                          <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                            {u.role==='student'
                              ? <span style={{ background:'rgba(37,99,235,0.15)',color:C.blueLight,padding:'2px 9px',borderRadius:12,fontSize:'0.72rem',fontWeight:700 }}>🎓 Student</span>
                              : <span style={{ background:'rgba(148,163,184,0.1)',color:C.textSecondary,padding:'2px 9px',borderRadius:12,fontSize:'0.72rem',fontWeight:700 }}>🌐 Visitor</span>
                            }
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: C.textSecondary }}>
                            {u.roll_number ? <><strong style={{color:C.textPrimary}}>{u.roll_number}</strong>{u.branch&&<span style={{color:C.textMuted,fontSize:'0.72rem',marginLeft:5}}>({u.branch})</span>}</> : '—'}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: C.textSecondary }}>{u.daily_limit}/day</td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{color:u.queries_used_today>=u.daily_limit?'#FCA5A5':C.textPrimary,fontWeight:700}}>{u.queries_used_today}</span>
                            <span style={{color:C.textMuted}}> / {u.total_queries_all_time}</span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            {u.malicious_query_count > 0
                              ? <span style={{ background:u.malicious_query_count>5?'rgba(220,38,38,0.15)':'rgba(217,119,6,0.12)', color:u.malicious_query_count>5?'#FCA5A5':'#FCD34D', padding:'2px 9px',borderRadius:12,fontSize:'0.75rem',fontWeight:700 }}>⚠ {u.malicious_query_count}</span>
                              : <span style={{color:C.textMuted}}>0</span>
                            }
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: C.textMuted }}>{userSearchQuery ? `No users matching "${userSearchQuery}"` : 'No users found.'}</td></tr>
                      )}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────
export const AdminPage = () => {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const login  = t => { localStorage.setItem(ADMIN_TOKEN_KEY, t); setToken(t); };
  const logout = () => { localStorage.removeItem(ADMIN_TOKEN_KEY); setToken(null); };
  return token ? <Dashboard token={token} onLogout={logout} /> : <LoginPage onLogin={login} />;
};

export default AdminPage;
