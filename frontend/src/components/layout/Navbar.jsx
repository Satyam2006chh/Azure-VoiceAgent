import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bot, Layers, Cpu, LayoutDashboard, ShieldCheck, LogOut, LogIn } from 'lucide-react';

const LogoMark = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="6"  stroke="rgba(255,255,255,0.45)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="2.5" fill="white"/>
    <line x1="12" y1="2"  x2="12" y2="6"  stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="2"  y1="12" x2="6"  y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
  </svg>
);

export const Navbar = () => {
  const { currentRoute, navigateTo, user, quotaInfo, openAuthModal, logoutUser } = useApp();

  const navItems = [
    { route: 'about',        label: 'Overview',     icon: <LayoutDashboard size={13} /> },
    { route: 'assistant',    label: 'Voice AI',     icon: <Bot size={13} /> },
    { route: 'architecture', label: 'Architecture', icon: <Layers size={13} /> },
    { route: 'technology',   label: 'Azure Stack',  icon: <Cpu size={13} /> },
    { route: 'admin',        label: 'Admin',        icon: <ShieldCheck size={13} /> },
  ];

  return (
    <header className="navbar-header">
      <div className="container navbar-container">

        {/* Brand */}
        <div className="navbar-brand" onClick={() => navigateTo('about')} style={{ cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            <div className="brand-icon"><LogoMark size={22} /></div>
            <div style={{
              position: 'absolute', inset: -4,
              background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span className="brand-title">UniVoice</span>
            <span className="brand-sub">Azure AI · Multilingual</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 20, padding: '2px 8px',
            fontSize: '0.65rem', fontWeight: 700, color: '#60A5FA', letterSpacing: '0.03em',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399', flexShrink: 0 }}/>
            Live
          </div>
        </div>

        {/* Nav pills */}
        <nav className="nav-pills">
          {navItems.map(({ route, label, icon }) => (
            <button
              key={route}
              onClick={() => navigateTo(route)}
              className={`nav-pill-btn ${currentRoute === route ? 'active' : ''}`}
            >
              {icon}<span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Right — user badge or sign-in only */}
        <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px',
                background: user.role === 'student' ? 'rgba(37,99,235,0.15)' : 'rgba(16,185,129,0.15)',
                border: user.role === 'student' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(16,185,129,0.4)',
                borderRadius: 20, fontSize: '0.82rem',
              }}>
                <span>{user.role === 'student' ? '🎓' : '🌐'}</span>
                <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{user.name}</span>
                <span style={{
                  background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 10,
                  color: quotaInfo.remaining_today > 0 ? '#38bdf8' : '#f87171',
                  fontWeight: 700, fontSize: '0.75rem',
                }}>
                  ⚡ {quotaInfo.remaining_today}/{quotaInfo.daily_limit}
                </span>
              </div>
              <button onClick={logoutUser} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <LogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <button onClick={openAuthModal} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 18px', borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              border: 'none', color: '#fff', fontWeight: 700,
              fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: '0 0 18px rgba(37,99,235,0.35)', fontFamily: 'inherit',
            }}>
              <LogIn size={14} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
