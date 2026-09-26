import React from 'react';
import { TEAM_MEMBERS, PROJECT_DETAILS } from '../data/teamData';
import { GraduationCap, Code2, ExternalLink, Sparkles } from 'lucide-react';

const ROLE_COLORS = {
  'Lead AI & Cloud Architect':     { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' },
  'Full-Stack & Voice Integrator': { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  'Knowledge & Data Engineer':     { color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  'Security & Cloud Engineer':     { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
};

export const TeamPage = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '3rem 0 6rem' }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 1.5rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 20, padding: '4px 12px',
          fontSize: '0.7rem', fontWeight: 700, color: '#60A5FA',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12,
        }}>
          <Sparkles size={10} /> Capstone Project · 2025–2026
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900,
          color: 'var(--text-primary)', letterSpacing: '-0.04em',
          marginBottom: 8, lineHeight: 1.1,
        }}>
          Engineering Team
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 6 }}>
          {PROJECT_DETAILS.institution} &nbsp;·&nbsp; {PROJECT_DETAILS.department}
        </p>
      </div>

      {/* ── Team Cards ── */}
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}>
          {TEAM_MEMBERS.map((member) => {
            const roleStyle = ROLE_COLORS[member.role] || { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' };
            return (
              <div key={member.rollNo} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '1.75rem 1.5rem',
                textAlign: 'center',
                transition: 'all 0.22s ease',
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = roleStyle.color + '60';
                  e.currentTarget.style.boxShadow = `0 0 28px ${roleStyle.color}18`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Top accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, transparent, ${roleStyle.color}, transparent)`,
                }} />

                {/* Avatar */}
                <div style={{
                  width: 62, height: 62, borderRadius: '50%',
                  background: member.avatarBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', fontWeight: 900, color: '#fff',
                  margin: '0.5rem auto 1rem',
                  boxShadow: `0 6px 20px ${member.avatarBg}55`,
                  border: `2px solid ${member.avatarBg}88`,
                }}>
                  {member.initials}
                </div>

                <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                  {member.name}
                </div>

                <div style={{
                  fontSize: '0.68rem', fontWeight: 700,
                  color: roleStyle.color, marginBottom: 6,
                  letterSpacing: '0.04em',
                }}>
                  {member.rollNo}
                </div>

                {/* Role badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: roleStyle.bg, border: `1px solid ${roleStyle.border}`,
                  borderRadius: 20, padding: '3px 10px', marginBottom: 10,
                  fontSize: '0.72rem', fontWeight: 700, color: roleStyle.color,
                }}>
                  {member.role}
                </div>

                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {member.bio}
                </p>

                {/* Social Links */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <a href={member.github} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <Code2 size={12} /> GitHub
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <ExternalLink size={12} /> LinkedIn
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Project Details Card ── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14, padding: '1.5rem 2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={16} color="#3B82F6" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              Project Details
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
          }}>
            {[
              { label: 'INSTITUTION',    value: PROJECT_DETAILS.institution },
              { label: 'DEPARTMENT',     value: PROJECT_DETAILS.department },
              { label: 'COURSE & YEAR',  value: `${PROJECT_DETAILS.course} · ${PROJECT_DETAILS.academicYear}` },
              { label: 'PROJECT MENTOR', value: PROJECT_DETAILS.professor, highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  color: 'var(--text-muted)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 5,
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: '0.875rem', fontWeight: 600,
                  color: highlight ? '#60A5FA' : 'var(--text-primary)',
                  lineHeight: 1.4,
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
